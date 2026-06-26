import React, { useState } from "react";
import { motion } from "motion/react";
import { useStore } from "../store";
import { v4 as uuidv4 } from "uuid";
import { Athlete } from "../types";
import { UserCheck, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";


const COMMON_SPORTS = [
  "Baseball", "Basketball", "Soccer", "Football", "Ice Hockey", "Tennis", "Volleyball",
  "Track and Field", "Cross Country", "Swimming", "Golf", "Gymnastics", "Wrestling",
  "Field Hockey", "Lacrosse", "Softball", "Cheerleading", "Water Polo", "Rowing",
  "Cycling", "Triathlon", "Martial Arts", "Rhythmic Gymnastics", "Boxing", "Fencing",
  "Rugby", "Cricket", "Badminton", "Table Tennis", "Weightlifting", "Powerlifting",
  "Alpine Skiing", "Snowboarding", "Figure Skating", "Surfing", "Equestrian", "Archery",
  "Shooting", "Sailing", "Rock Climbing", "Bowling", "Racquetball", "Squash", 
  "Handball", "Esports", "Motorsports", "Pickleball", "Ultimate Frisbee", "Bobsleigh", "Curling",
  "Auto Racing - Open Wheel", "Auto Racing - Stock Car", "Auto Racing - Sports Car/Endurance",
  "Auto Racing - Dirt Track/Sprint", "Auto Racing - Drag Racing", "Auto Racing - Rally/Off-Road",
  "Auto Racing - Karting", "Auto Racing - Sim Racing", "Other"
].sort();

const LEAGUES_LEVELS = [
  "Youth/Rec League",
  "Club/AAU/Travel",
  "Middle School",
  "High School (Freshman/JV)",
  "High School (Varsity)",
  "Junior College (JUCO)",
  "College (NCAA D3)",
  "College (NCAA D2)",
  "College (NCAA D1)",
  "College (NAIA/Other)",
  "Semi-Professional",
  "Professional",
  "Olympic/National",
  "Adult League/Recreational",
  "Racing - Pro Tier 1 (F1, Cup, IndyCar, Top Fuel)",
  "Racing - Pro Tier 2 (F2, Xfinity, Indy NXT)",
  "Racing - Pro Tier 3 (F3, Trucks, ARCA)",
  "Racing - Touring / Regional Series",
  "Racing - Local Short Track / Weekly",
  "Racing - Club / Amateur (SCCA, NASA)",
  "Racing - National / Inter. Karting",
  "Racing - Local / Club Karting",
  "Other"
];

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
    dateOfBirth: "",
    sport: "",
    level: "",
    position: "",
    team: "",
    parentGuardianName: "",
    parentGuardianEmail: "",
    parentGuardianPhone: "",
    dominantHand: "",
    dominantEye: "",
    correctiveLenses: "None",
    concussionHistory: "Prefer not to say",
    interestedInEvaluation: "Maybe",
    interestedInTraining: "Maybe",
    consentAccepted: false,
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const diff_ms = Date.now() - new Date(dob).getTime();
    const age_dt = new Date(diff_ms); 
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

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

  const isRacing = formData.sport ? (formData.sport.startsWith("Auto Racing") || formData.sport === "Motorsports") : false;
  
  const filteredLevels = isRacing
    ? LEAGUES_LEVELS.filter(l => l.startsWith("Racing") || l === "Other")
    : LEAGUES_LEVELS.filter(l => !l.startsWith("Racing"));

  const getPositionSuggestions = () => {
    if (isRacing) {
      return [
        "Driver",
        "Spotter",
        "Crew Chief",
        "Pit Crew - Tire Changer",
        "Pit Crew - Tire Carrier",
        "Pit Crew - Jackman",
        "Pit Crew - Fueler",
        "Engineer",
        "Mechanic"
      ];
    }
    if (formData.sport === "Football") {
      return ["Quarterback", "Running Back", "Wide Receiver", "Tight End", "Offensive Lineman", "Defensive Lineman", "Linebacker", "Cornerback", "Safety", "Kicker", "Punter"];
    }
    if (formData.sport === "Basketball") {
      return ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"];
    }
    if (formData.sport === "Soccer") {
      return ["Goalkeeper", "Defender", "Midfielder", "Forward", "Striker"];
    }
    if (formData.sport === "Baseball" || formData.sport === "Softball") {
      return ["Pitcher", "Catcher", "First Baseman", "Second Baseman", "Third Baseman", "Shortstop", "Left Fielder", "Center Fielder", "Right Fielder", "Designated Hitter"];
    }
    return [
      "Quarterback", "Point Guard", "Goalkeeper", "Pitcher", "Forward", "Defenseman", "Center"
    ];
  };

  const suggestions = getPositionSuggestions();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setFormData((prev) => {
      const updated = { ...prev, [name]: type === "checkbox" ? checked : value };
      if (name === "sport") {
        updated.level = "";
        updated.position = "";
      }
      return updated;
    });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all as touched on submit
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

    const age = calculateAge(formData.dateOfBirth);

    // Check Duplicate
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
      ...formData,
      age,
      raffleId: generatedRaffleID,
      tickets: 1, // Start with 1 free ticket as a floor
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
        dateOfBirth: "",
        sport: "",
        level: "",
        position: "",
        team: "",
        parentGuardianName: "",
        parentGuardianEmail: "",
        parentGuardianPhone: "",
        dominantHand: "",
        dominantEye: "",
        correctiveLenses: "None",
        concussionHistory: "Prefer not to say",
        interestedInEvaluation: "Maybe",
        interestedInTraining: "Maybe",
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

  const getGuardianInputClass = (name: string) => {
    const hasError = touched[name] && errors[name];
    return `w-full bg-[var(--color-ares-charcoal)] border rounded-xl px-4 py-3 text-white focus:outline-none text-sm transition-colors ${
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
        <p className="text-xs text-[var(--color-ares-muted)] mb-8">Registered athletes start with 1 free ticket! Earn up to 4 more tickets by completing each drill.</p>
        <button onClick={() => setSuccess(false)} className="px-8 py-3 bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-teal)] text-[var(--color-ares-teal)] font-bold tracking-widest uppercase rounded-xl hover:bg-[var(--color-ares-teal)] hover:text-white transition-all">
          Register Another
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
      <header>
        <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--color-ares-white)]">Athlete Registration</h2>
        <p className="text-[var(--color-ares-muted)] text-sm mt-1">Please fill out all required fields.</p>
      </header>
      
      <form onSubmit={handleSubmit} className="p-8 bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl space-y-8 relative overflow-hidden">
        
        <div className="space-y-6 relative z-10">
          <div>
            <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-teal)] uppercase mb-4">Required Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input required name="firstName" value={formData.firstName} onChange={handleChange} onBlur={handleBlur} placeholder="First Name" className={getInputClass("firstName")} />
                {renderError("firstName")}
              </div>
              <div>
                <input required name="lastName" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} placeholder="Last Name" className={getInputClass("lastName")} />
                {renderError("lastName")}
              </div>
              <div>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} placeholder="Email Address" className={getInputClass("email")} />
                {renderError("email")}
              </div>
              <div>
                <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} placeholder="Phone Number" className={getInputClass("phone")} />
                {renderError("phone")}
              </div>
              <div className="flex flex-col col-span-1 md:col-span-2">
                <span className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider mb-1 px-1">Date of Birth</span>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} onBlur={handleBlur} className={getInputClass("dateOfBirth")} />
                {renderError("dateOfBirth")}
              </div>
            </div>
          </div>

          <div>
             <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-teal)] uppercase mb-4">Sports Profile</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <select name="sport" value={formData.sport} onChange={handleChange} onBlur={handleBlur} className={getInputClass("sport")}>
                  <option value="" disabled>Select Primary Sport</option>
                  {COMMON_SPORTS.map(s => <option key={s} value={s} className="bg-[var(--color-ares-bg)] text-white">{s}</option>)}
                </select>
                {renderError("sport")}
              </div>
              <div>
                <select name="level" value={formData.level} onChange={handleChange} onBlur={handleBlur} className={getInputClass("level")}>
                  <option value="" disabled>Select Level / League</option>
                  {filteredLevels.map(l => <option key={l} value={l} className="bg-[var(--color-ares-bg)] text-white">{l}</option>)}
                </select>
                {renderError("level")}
              </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input list="position-suggestions" name="position" value={formData.position} onChange={handleChange} onBlur={handleBlur} placeholder="Position (e.g. QB, Driver, Midfielder)" className={getInputClass("position")} />
                <datalist id="position-suggestions">
                  {suggestions.map(s => <option key={s} value={s} />)}
                </datalist>
                {renderError("position")}
              </div>
              <div>
                <input name="team" value={formData.team} onChange={handleChange} onBlur={handleBlur} placeholder="Team / School / Organization" className={getInputClass("team")} />
                {renderError("team")}
              </div>
             </div>
          </div>

          <div>
             <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-teal)] uppercase mb-4">Visual & Health Profile</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <select name="dominantHand" value={formData.dominantHand} onChange={handleChange} onBlur={handleBlur} className={getInputClass("dominantHand")}>
                  <option value="" disabled>Select Dominant Hand</option>
                  <option value="Right" className="bg-[var(--color-ares-bg)] text-white">Right Handed</option>
                  <option value="Left" className="bg-[var(--color-ares-bg)] text-white">Left Handed</option>
                  <option value="Ambidextrous" className="bg-[var(--color-ares-bg)] text-white">Ambidextrous</option>
                </select>
                {renderError("dominantHand")}
              </div>
              <div>
                <select name="dominantEye" value={formData.dominantEye} onChange={handleChange} onBlur={handleBlur} className={getInputClass("dominantEye")}>
                  <option value="" disabled>Select Dominant Eye</option>
                  <option value="Right" className="bg-[var(--color-ares-bg)] text-white">Right Eye Dominant</option>
                  <option value="Left" className="bg-[var(--color-ares-bg)] text-white">Left Eye Dominant</option>
                  <option value="Ambidextrous" className="bg-[var(--color-ares-bg)] text-white">Ambidextrous / Neutral</option>
                </select>
                {renderError("dominantEye")}
              </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <select name="correctiveLenses" value={formData.correctiveLenses} onChange={handleChange} onBlur={handleBlur} className={getInputClass("correctiveLenses")}>
                  <option value="" disabled>Corrective Lenses / Vision Correction</option>
                  <option value="None" className="bg-[var(--color-ares-bg)] text-white">None</option>
                  <option value="Glasses" className="bg-[var(--color-ares-bg)] text-white">Glasses</option>
                  <option value="Contacts" className="bg-[var(--color-ares-bg)] text-white">Contacts</option>
                  <option value="Both" className="bg-[var(--color-ares-bg)] text-white">Both Glasses & Contacts</option>
                </select>
                {renderError("correctiveLenses")}
              </div>
              <div>
                <select name="concussionHistory" value={formData.concussionHistory} onChange={handleChange} onBlur={handleBlur} className={getInputClass("concussionHistory")}>
                  <option value="" disabled>History of Concussions?</option>
                  <option value="Yes" className="bg-[var(--color-ares-bg)] text-white">Yes, history of concussion</option>
                  <option value="No" className="bg-[var(--color-ares-bg)] text-white">No history of concussion</option>
                  <option value="Prefer not to say" className="bg-[var(--color-ares-bg)] text-white">Prefer not to say</option>
                </select>
                {renderError("concussionHistory")}
              </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <select name="interestedInEvaluation" value={formData.interestedInEvaluation} onChange={handleChange} onBlur={handleBlur} className={getInputClass("interestedInEvaluation")}>
                  <option value="" disabled>Interested in Sports Vision Evaluation?</option>
                  <option value="Yes" className="bg-[var(--color-ares-bg)] text-white">Yes</option>
                  <option value="No" className="bg-[var(--color-ares-bg)] text-white">No</option>
                  <option value="Maybe" className="bg-[var(--color-ares-bg)] text-white">Maybe</option>
                </select>
                {renderError("interestedInEvaluation")}
              </div>
              <div>
                <select name="interestedInTraining" value={formData.interestedInTraining} onChange={handleChange} onBlur={handleBlur} className={getInputClass("interestedInTraining")}>
                  <option value="" disabled>Interested in Sports Vision Training?</option>
                  <option value="Yes" className="bg-[var(--color-ares-bg)] text-white">Yes</option>
                  <option value="No" className="bg-[var(--color-ares-bg)] text-white">No</option>
                  <option value="Maybe" className="bg-[var(--color-ares-bg)] text-white">Maybe</option>
                </select>
                {renderError("interestedInTraining")}
              </div>
             </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--color-ares-dark-purple)] bg-[var(--color-ares-bg)]/50">
             <h3 className="text-[10px] font-bold tracking-[0.2em] text-[var(--color-ares-purple)] uppercase mb-3">Minors (Under 18) - Parent/Guardian Details</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <input name="parentGuardianName" value={formData.parentGuardianName} onChange={handleChange} onBlur={handleBlur} placeholder="Parent/Guardian Name" className={getGuardianInputClass("parentGuardianName")} />
                {renderError("parentGuardianName")}
              </div>
              <div>
                <input type="email" name="parentGuardianEmail" value={formData.parentGuardianEmail} onChange={handleChange} onBlur={handleBlur} placeholder="Parent/Guardian Email" className={getGuardianInputClass("parentGuardianEmail")} />
                {renderError("parentGuardianEmail")}
              </div>
              <div>
                <input type="tel" name="parentGuardianPhone" value={formData.parentGuardianPhone} onChange={handleChange} onBlur={handleBlur} placeholder="Parent/Guardian Phone" className={getGuardianInputClass("parentGuardianPhone")} />
                {renderError("parentGuardianPhone")}
              </div>
             </div>
          </div>

          <div className="border-t border-[var(--color-ares-dark-purple)] pt-6 mt-6">
            <label className="flex items-start space-x-3 cursor-pointer group">
              <div className="mt-1">
                <input required type="checkbox" name="consentAccepted" checked={formData.consentAccepted} onChange={handleChange} onBlur={handleBlur} className="w-5 h-5 accent-[var(--color-ares-teal)] bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[var(--color-ares-muted)] leading-relaxed">
                  “I consent to Ares Elite Sports Vision collecting and storing this athlete’s event performance data and contact information for leaderboard participation, performance review, and follow-up communication regarding evaluations, training, and related services.”
                </p>
                {renderError("consentAccepted")}
              </div>
            </label>
          </div>
        </div>

        <button type="submit" className="w-full md:w-auto px-10 py-4 bg-[var(--color-ares-teal)] text-white font-black tracking-widest uppercase rounded-xl hover:bg-opacity-90 glow-shadow transition-all relative z-10">
          Register Athlete
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
