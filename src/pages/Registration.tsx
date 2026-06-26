import React, { useState } from "react";
import { motion } from "motion/react";
import { useStore } from "../store";
import { v4 as uuidv4 } from "uuid";
import { Lead, EventLead, RaffleEntry } from "../types";
import { UserCheck, AlertCircle, Brain, Zap, Clock, Activity, Calendar, MapPin, User, CheckCircle2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { syncLeadToFirebase, syncEventLeadToFirebase, syncRaffleEntryToFirebase } from "../lib/firebase-sync";

export function Registration() {
  const { addLead, addEventLead, addRaffleEntry, events, eventDays, currentEventId } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registeredRaffleId, setRegisteredRaffleId] = useState<number | null>(null);
  const [registeredLead, setRegisteredLead] = useState<{ id: string; name: string } | null>(null);

  // Extract Event ID from search parameter or fallback to active event in store
  const eventId = searchParams.get("eventId") || currentEventId;
  const event = events.find((e) => e.id === eventId);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organization: "",
    role: "athlete" as Lead["role"],
    sportOrIndustry: "",
    ageGroup: "high school" as Lead["age_group"],
    howDidYouHear: "",
    referralCode: "",
    consentEmail: true,
    consentSms: true,
    consentLeaderboard: true,
    biggestChallenge: "",
    interestLevel: "training",
    notes: "",
    staffCaptured: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Early Registration vs Ended Check
  let eventState: "active" | "early" | "ended" | "no_event" = "active";
  if (!event) {
    eventState = "no_event";
  } else {
    const now = new Date();
    const start = new Date(event.start_datetime);
    const end = new Date(event.end_datetime);

    if (now < start) {
      eventState = "early";
    } else if (now > end) {
      eventState = "ended";
    }
  }

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

    if (!data.organization.trim()) errs.organization = "Organization/Team is required";
    if (!data.sportOrIndustry.trim()) errs.sportOrIndustry = "Sport or industry is required";

    return errs;
  };

  const errors = getFormErrors(formData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

    setLoading(true);
    const generatedRaffleNum = Math.floor(100000 + Math.random() * 900000);

    const leadId = uuidv4();
    const newLead: Lead = {
      id: leadId,
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      organization: formData.organization,
      role: formData.role,
      sport_or_industry: formData.sportOrIndustry,
      age_group: formData.ageGroup,
      consent_email: formData.consentEmail,
      consent_sms: formData.consentSms,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Determine Multi-Day Conference Day
    let currentDayId = "";
    if (event) {
      const todayStr = new Date().toISOString().split("T")[0];
      const matchDay = eventDays.find(d => d.event_id === event.id && d.date === todayStr);
      if (matchDay) currentDayId = matchDay.id;
    }

    const eventLeadId = uuidv4();
    const newEventLead: EventLead = {
      id: eventLeadId,
      event_id: eventId || "unassigned",
      event_day_id: currentDayId || undefined,
      lead_id: leadId,
      referral_code: formData.referralCode || String(generatedRaffleNum),
      lead_source: eventState === "ended" ? "post-event lead" : (formData.staffCaptured ? "Staff input" : "QR Code"),
      staff_member: formData.staffCaptured || undefined,
      interest_type: formData.interestLevel,
      submission_timestamp: new Date().toISOString(),
      raffle_eligible: formData.consentEmail, // Opting into raffle requires email consent
      follow_up_status: formData.consentEmail ? "pending" : "sequence_paused",
      biggest_challenge: formData.biggestChallenge || undefined,
      notes: formData.notes || undefined
    };

    // Sync to store & firebase
    addLead(newLead);
    addEventLead(newEventLead);
    await syncLeadToFirebase(newLead);
    await syncEventLeadToFirebase(newEventLead);

    // If opted into raffle, save a base RaffleEntry
    if (formData.consentEmail) {
      const raffleEntryId = uuidv4();
      const newRaffleEntry: RaffleEntry = {
        id: raffleEntryId,
        event_id: eventId || "unassigned",
        event_day_id: currentDayId || undefined,
        lead_id: leadId,
        entry_timestamp: new Date().toISOString(),
        entry_count: 1, // 1 floor base ticket
        winner_status: "eligible"
      };
      addRaffleEntry(newRaffleEntry);
      await syncRaffleEntryToFirebase(newRaffleEntry);
    }

    setRegisteredRaffleId(generatedRaffleNum);
    setRegisteredLead({ id: leadId, name: `${newLead.first_name} ${newLead.last_name}` });
    setLoading(false);
    setSuccess(true);
    setTouched({});
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      organization: "",
      role: "athlete",
      sportOrIndustry: "",
      ageGroup: "high school",
      howDidYouHear: "",
      referralCode: "",
      consentEmail: true,
      consentSms: true,
      consentLeaderboard: true,
      biggestChallenge: "",
      interestLevel: "training",
      notes: "",
      staffCaptured: "",
    });
  };

  const getInputClass = (name: string) => {
    const hasError = touched[name] && errors[name];
    return `w-full bg-[var(--color-ares-bg)] border rounded-xl px-4 py-3 text-white focus:outline-none transition-colors text-sm ${
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

  if (eventState === "no_event") {
    return (
      <div className="max-w-md mx-auto text-center py-20 bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl p-8 space-y-6">
        <AlertCircle size={48} className="text-amber-500 mx-auto" />
        <h2 className="text-2xl font-bold uppercase text-white">No Event Selected</h2>
        <p className="text-[var(--color-ares-muted)] text-sm">
          Please select an active event in the Admin Dashboard or scan an event QR code to access this form.
        </p>
        <button onClick={() => navigate("/admin")} className="px-6 py-2.5 bg-[var(--color-ares-teal)] text-white text-xs font-bold uppercase rounded-lg">
          Go to Admin Panel
        </button>
      </div>
    );
  }

  if (success && registeredLead) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto space-y-6">
        <div className="w-20 h-20 bg-[var(--color-ares-teal)]/20 rounded-full flex items-center justify-center text-[var(--color-ares-teal)] mb-2 glow-shadow">
          <UserCheck size={40} />
        </div>
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-tight text-white mb-2 font-black">Registration Complete!</h2>
          <p className="text-[var(--color-ares-muted)] text-sm">
            Athlete <span className="text-white font-bold">{registeredLead.name}</span> has been registered for <span className="text-white font-semibold">{event?.name}</span> with Raffle Number:
          </p>
          <p className="text-2xl font-mono font-black text-[var(--color-ares-teal)] mt-2">#{registeredRaffleId}</p>
        </div>

        {eventState !== "ended" && (
          <div className="w-full bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl p-6 space-y-4">
            <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--color-ares-purple)] uppercase">Select Drill to Record Score</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/entry", { state: { athleteId: registeredLead.id, activeDrill: "GUST" } })}
                className="flex items-center justify-center gap-2 p-3 bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl text-xs font-bold uppercase tracking-wider text-white hover:border-[var(--color-ares-teal)] hover:bg-white/5 transition-all cursor-pointer"
              >
                <Brain size={14} className="text-[var(--color-ares-teal)]" />
                GUST
              </button>
              <button
                onClick={() => navigate("/entry", { state: { athleteId: registeredLead.id, activeDrill: "RRT" } })}
                className="flex items-center justify-center gap-2 p-3 bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl text-xs font-bold uppercase tracking-wider text-white hover:border-[#a78bfa] hover:bg-white/5 transition-all cursor-pointer"
              >
                <Zap size={14} className="text-[#a78bfa]" />
                RRT
              </button>
              <button
                onClick={() => navigate("/entry", { state: { athleteId: registeredLead.id, activeDrill: "GoNoGo" } })}
                className="flex items-center justify-center gap-2 p-3 bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl text-xs font-bold uppercase tracking-wider text-white hover:border-[#34d399] hover:bg-white/5 transition-all cursor-pointer"
              >
                <Clock size={14} className="text-[#34d399]" />
                Go/No-Go
              </button>
              <button
                onClick={() => navigate("/entry", { state: { athleteId: registeredLead.id, activeDrill: "CRT" } })}
                className="flex items-center justify-center gap-2 p-3 bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl text-xs font-bold uppercase tracking-wider text-white hover:border-[#fb923c] hover:bg-white/5 transition-all cursor-pointer"
              >
                <Activity size={14} className="text-[#fb923c]" />
                CRT
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => { setSuccess(false); setRegisteredLead(null); }}
          className="w-full px-8 py-3 bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-teal)] text-[var(--color-ares-teal)] font-bold tracking-widest uppercase rounded-xl hover:bg-[var(--color-ares-teal)] hover:text-white transition-all cursor-pointer"
        >
          Register Another
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto space-y-8 pb-12">
      <header className="text-center bg-[var(--color-ares-charcoal)]/40 p-6 rounded-2xl border border-[var(--color-ares-dark-purple)] space-y-2">
        <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--color-ares-white)]">{event?.name}</h2>
        <div className="flex items-center justify-center gap-4 text-xs text-[var(--color-ares-muted)]">
          <span className="flex items-center gap-1"><MapPin size={12} /> {event?.location}</span>
          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(event!.start_datetime).toLocaleDateString()}</span>
        </div>
      </header>

      {/* Time Bounds Notification Banners */}
      {eventState === "early" && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-2 text-center">
          <Calendar className="mx-auto" size={24} />
          <p className="font-bold uppercase tracking-wider">This event has not started yet</p>
          <p>Official schedule begins {new Date(event!.start_datetime).toLocaleString()}. You may submit an early registration below to secure your raffle spot.</p>
        </div>
      )}

      {eventState === "ended" && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 space-y-2 text-center">
          <AlertCircle className="mx-auto" size={24} />
          <p className="font-bold uppercase tracking-wider">This event has ended</p>
          <p>The leaderboard and live raffle drawings are closed. However, you can register below to join our post-event contact list and receive resource templates.</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="p-8 bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl space-y-6 relative overflow-hidden">
        <div className="space-y-4 relative z-10">
          <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-teal)] uppercase border-b border-[var(--color-ares-dark-purple)] pb-2 mb-4">Contact Information</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider mb-1 px-1 block">First Name *</label>
              <input required name="firstName" value={formData.firstName} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. John" className={getInputClass("firstName")} />
              {renderError("firstName")}
            </div>
            <div>
              <label className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider mb-1 px-1 block">Last Name *</label>
              <input required name="lastName" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. Doe" className={getInputClass("lastName")} />
              {renderError("lastName")}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider mb-1 px-1 block">Email Address *</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. john.doe@example.com" className={getInputClass("email")} />
              {renderError("email")}
            </div>
            <div>
              <label className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider mb-1 px-1 block">Phone Number *</label>
              <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. 555-123-4567" className={getInputClass("phone")} />
              {renderError("phone")}
            </div>
          </div>

          <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-teal)] uppercase border-b border-[var(--color-ares-dark-purple)] pb-2 pt-4 mb-4">Profile & Organization</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider mb-1 px-1 block">Organization / Team / Company *</label>
              <input required name="organization" value={formData.organization} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. Ares Elite Academy" className={getInputClass("organization")} />
              {renderError("organization")}
            </div>
            <div>
              <label className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider mb-1 px-1 block">Sport or Industry *</label>
              <input required name="sportOrIndustry" value={formData.sportOrIndustry} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. Baseball / Sports Science" className={getInputClass("sportOrIndustry")} />
              {renderError("sportOrIndustry")}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider mb-1 px-1 block">Role *</label>
              <select name="role" value={formData.role} onChange={handleChange} className={getInputClass("role")}>
                <option value="athlete">Athlete</option>
                <option value="coach">Coach</option>
                <option value="parent">Parent</option>
                <option value="performance staff">Performance Staff</option>
                <option value="medical staff">Medical Staff</option>
                <option value="executive">Executive</option>
                <option value="vendor">Vendor</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider mb-1 px-1 block">Age Group / Level *</label>
              <select name="ageGroup" value={formData.ageGroup} onChange={handleChange} className={getInputClass("ageGroup")}>
                <option value="youth">Youth</option>
                <option value="high school">High School</option>
                <option value="college">College</option>
                <option value="professional">Professional</option>
                <option value="tactical">Tactical (Military/LEO)</option>
                <option value="corporate">Corporate</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider mb-1 px-1 block">Referral Code (Optional)</label>
              <input name="referralCode" value={formData.referralCode} onChange={handleChange} placeholder="e.g. COACH100" className={getInputClass("referralCode")} />
            </div>
            <div>
              <label className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider mb-1 px-1 block">Staff Recruiter (Optional)</label>
              <input name="staffCaptured" value={formData.staffCaptured} onChange={handleChange} placeholder="Captured by staff..." className={getInputClass("staffCaptured")} />
            </div>
          </div>

          <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-teal)] uppercase border-b border-[var(--color-ares-dark-purple)] pb-2 pt-4 mb-4">Ares Sports Vision Insights</h3>
          
          <div>
            <label className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider mb-1 px-1 block">Biggest Performance Challenge (Optional)</label>
            <textarea name="biggestChallenge" value={formData.biggestChallenge} onChange={handleChange} placeholder="e.g. Tracking fast balls, focus under pressure..." rows={2} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider mb-1 px-1 block">Interest Level *</label>
              <select name="interestLevel" value={formData.interestLevel} onChange={handleChange} className={getInputClass("interestLevel")}>
                <option value="evaluation">Schedule individual evaluation</option>
                <option value="team testing">Team testing & benchmarking</option>
                <option value="training">Weekly Sports Vision Training</option>
                <option value="certification">Professional certification</option>
                <option value="speaking">Keynote speaking engagement</option>
                <option value="partnership">Business Partnership</option>
                <option value="other">Other / Keep in touch</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider mb-1 px-1 block">Notes / Questions (Optional)</label>
              <input name="notes" value={formData.notes} onChange={handleChange} placeholder="Any other questions..." className={getInputClass("notes")} />
            </div>
          </div>

          <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-teal)] uppercase border-b border-[var(--color-ares-dark-purple)] pb-2 pt-4 mb-4">Consents & Options</h3>
          
          <div className="space-y-3 pt-2">
            <label className="flex items-start space-x-3 cursor-pointer group">
              <input type="checkbox" name="consentEmail" checked={formData.consentEmail} onChange={handleChange} className="mt-1 w-5 h-5 accent-[var(--color-ares-teal)] bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-[var(--color-ares-muted)] leading-relaxed">
                  I consent to receive follow-up emails regarding evaluations, training programs, case studies, and related performance insights from Ares Elite Sports Vision.
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer group">
              <input type="checkbox" name="consentSms" checked={formData.consentSms} onChange={handleChange} className="mt-1 w-5 h-5 accent-[var(--color-ares-teal)] bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-[var(--color-ares-muted)] leading-relaxed">
                  I consent to receive occasional text messages (SMS) regarding training bookings, live event raffle alerts, and scheduling updates.
                </p>
              </div>
            </label>
          </div>

          <div className="border-t border-[var(--color-ares-dark-purple)] pt-6 mt-6">
            <label className="flex items-start space-x-3 cursor-pointer group">
              <input required type="checkbox" name="consentLeaderboard" checked={formData.consentLeaderboard} onChange={handleChange} className="mt-1 w-5 h-5 accent-[var(--color-ares-teal)] bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-[var(--color-ares-muted)] leading-relaxed">
                  “I consent to Ares Elite Sports Vision collecting and storing my event performance data and contact details for event leaderboard rankings, performance reviews, and prize raffle entries.”
                </p>
              </div>
            </label>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full px-10 py-4 bg-[var(--color-ares-teal)] text-white font-black tracking-widest uppercase rounded-xl hover:bg-opacity-90 glow-shadow transition-all relative z-10 text-sm disabled:opacity-40">
          {eventState === "ended" ? "Join Post-Event List" : "Register for Event & Raffle"}
        </button>
      </form>

      {loading && (
        <div className="fixed inset-0 bg-[var(--color-ares-bg)]/85 z-50 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-3 border-[var(--color-ares-teal)] border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-xs font-mono tracking-widest animate-pulse">CREATING PROFILE...</p>
        </div>
      )}
    </motion.div>
  );
}
