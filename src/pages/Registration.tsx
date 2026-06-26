import React, { useState } from "react";
import { motion } from "motion/react";
import { useStore } from "../store";
import { v4 as uuidv4 } from "uuid";
import { Athlete } from "../types";
import { UserCheck, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { syncAthleteToFirebase } from "../lib/firebase-sync";

export function Registration() {
  const { addAthlete, athletes } = useStore();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registeredRaffleId, setRegisteredRaffleId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    consentAccepted: false,
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const getFormErrors = (data: typeof formData) => {
    const errs: Record<string, string> = {};
    if (!data.firstName.trim()) errs.firstName = "First name is required";
    if (!data.lastName.trim()) errs.lastName = "Last name is required";
    
    if (!data.email.trim()) {
      errs.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      errs.email = "Invalid email address";
    }
    
    if (!data.phone.trim()) {
      errs.phone = "Phone number is required";
    } else if (data.phone.replace(/\D/g, "").length < 10) {
      errs.phone = "Phone number must be at least 10 digits";
    }
    
    if (!data.consentAccepted) errs.consentAccepted = "Consent must be accepted";

    return errs;
  };

  const errors = getFormErrors(formData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const allTouched = Object.keys(formData).reduce(
      (acc, key) => ({ ...acc, [key]: true }), 
      {}
    );
    setTouched(allTouched);

    if (Object.keys(errors).length > 0) {
      const firstErrorMsg = Object.values(errors)[0];
      alert(`Please fix form validation errors: ${firstErrorMsg}`);
      return;
    }

    const isDuplicate = athletes.some(
      (a) => a.email === formData.email || (a.firstName === formData.firstName && a.lastName === formData.lastName)
    );

    if (isDuplicate) {
      const confirm = window.confirm("An athlete with this name or email already exists. Continue anyway?");
      if (!confirm) return;
    }

    setLoading(true);
    const generatedRaffleID = Math.floor(100000 + Math.random() * 900000);

    const newAthlete: Athlete = {
      id: uuidv4(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      consentAccepted: formData.consentAccepted,
      sport: "Other",
      level: "Other",
      position: "N/A",
      team: "N/A",
      dominantHand: "N/A",
      dominantEye: "N/A",
      correctiveLenses: "None",
      concussionHistory: "Prefer not to say",
      interestedInEvaluation: "Maybe",
      interestedInTraining: "Maybe",
      parentGuardianName: "",
      parentGuardianEmail: "",
      parentGuardianPhone: "",
      dateOfBirth: "",
      age: 0,
      raffleId: generatedRaffleID,
      tickets: 1,
      createdAt: new Date().toISOString()
    };

    addAthlete(newAthlete);
    await syncAthleteToFirebase(newAthlete);
    setRegisteredRaffleId(generatedRaffleID);
    setLoading(false);
    setSuccess(true);
    setTouched({});
    setTimeout(() => {
      setSuccess(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        consentAccepted: false,
      });
    }, 4000);
  };

  const getInputClass = (name: string) => {
    const hasError = touched[name] && errors[name];
    return `w-full bg-[var(--color-ares-bg)] border rounded-xl px-4 py-3 text-white focus:outline-none transition-colors ${
      hasError 
        ? "border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
        : "border-[var(--color-ares-dark-purple)] focus:border-[var(--color-ares-teal)]"
    }`;
  };

  const renderError = (name: string) => {
    if (touched[name] && errors[name]) {
      return (
        <span className="text-[10px] text-red-400 mt-1 pl-1 block font-medium">
          {errors[name]}
        </span>
      );
    }
    return null;
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-[var(--color-ares-teal)]/20 rounded-full flex items-center justify-center text-[var(--color-ares-teal)] mb-6 glow-shadow">
          <UserCheck size={40} />
        </div>
        <h2 className="text-3xl font-bold uppercase tracking-tight text-white mb-2">Registration Complete!</h2>
        <p className="text-[var(--color-ares-muted)] mb-2">The athlete has been registered with Raffle ID <span className="text-[var(--color-ares-teal)] font-bold font-mono">#{registeredRaffleId}</span></p>
        <button onClick={() => setSuccess(false)} className="px-8 py-3 bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-teal)] text-[var(--color-ares-teal)] font-bold tracking-widest uppercase rounded-xl hover:bg-[var(--color-ares-teal)] hover:text-white transition-all">
          Register Another
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto space-y-8">
      <header className="text-center">
        <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--color-ares-white)]">Athlete Registration</h2>
        <p className="text-[var(--color-ares-muted)] text-sm mt-1">Please enter your information to register for the event.</p>
      </header>
      
      <form onSubmit={handleSubmit} className="p-8 bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl space-y-6 relative overflow-hidden">
        <div className="space-y-4 relative z-10">
          <div>
            <label className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider mb-1 px-1 block">First Name</label>
            <input required name="firstName" value={formData.firstName} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. John" className={getInputClass("firstName")} />
            {renderError("firstName")}
          </div>

          <div>
            <label className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider mb-1 px-1 block">Last Name</label>
            <input required name="lastName" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. Doe" className={getInputClass("lastName")} />
            {renderError("lastName")}
          </div>

          <div>
            <label className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider mb-1 px-1 block">Email Address</label>
            <input required type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. john.doe@example.com" className={getInputClass("email")} />
            {renderError("email")}
          </div>

          <div>
            <label className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider mb-1 px-1 block">Phone Number</label>
            <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. 555-123-4567" className={getInputClass("phone")} />
            {renderError("phone")}
          </div>

          <div className="border-t border-[var(--color-ares-dark-purple)] pt-6 mt-6">
            <label className="flex items-start space-x-3 cursor-pointer group">
              <div className="mt-1">
                <input required type="checkbox" name="consentAccepted" checked={formData.consentAccepted} onChange={handleChange} onBlur={handleBlur} className="w-5 h-5 accent-[var(--color-ares-teal)] bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[var(--color-ares-muted)] leading-relaxed">
                  “I consent to Ares Elite Sports Vision collecting and storing my event performance data and contact information for leaderboard participation, performance review, and follow-up communication regarding evaluations, training, and related services.”
                </p>
                {renderError("consentAccepted")}
              </div>
            </label>
          </div>
        </div>

        <button type="submit" className="w-full px-10 py-4 bg-[var(--color-ares-teal)] text-white font-black tracking-widest uppercase rounded-xl hover:bg-opacity-90 glow-shadow transition-all relative z-10">
          Register for Raffle
        </button>
      </form>

      {loading && (
        <div className="fixed inset-0 bg-[var(--color-ares-bg)]/85 z-50 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-3 border-[var(--color-ares-teal)] border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-xs font-mono tracking-widest animate-pulse">CREATING ATHLETE PROFILE...</p>
        </div>
      )}
    </motion.div>
  );
}
