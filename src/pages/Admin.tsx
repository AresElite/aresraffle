import React, { useState, useMemo } from "react";
import { useStore } from "../store";
import {
  Download, Users, ClipboardList, Trash2, RotateCcw, Edit, Plus, Calendar, MapPin, QrCode, Mail, MessageSquare, Check, X, TestTube, CheckCircle2, AlertCircle, Info, ExternalLink, Play
} from "lucide-react";
import { exportToCSV } from "../lib/utils";
import {
  syncEventToFirebase, deleteEventFromFirebase, syncEventDayToFirebase, syncLeadToFirebase, syncEventLeadToFirebase,
  syncEmailSequenceToFirebase, syncEmailMessageToFirebase, syncEmailLogToFirebase, deleteLeaderboardEntryFromFirebase
} from "../lib/firebase-sync";
import { Athlete, Event, EventDay, Lead, EventLead, EmailSequence, EmailMessage, EmailLog } from "../types";
import { v4 as uuidv4 } from "uuid";

export function Admin() {
  const {
    events, eventDays, leads, eventLeads, emailSequences, emailMessages, emailLogs, leaderboardEntries, currentEventId,
    addEvent, updateEvent, deleteEvent, setCurrentEvent, addEventDay, addLead, updateLead, updateEventLead,
    addEmailSequence, updateEmailSequence, addEmailMessage, updateEmailMessage, addEmailLog, updateEmailLog
  } = useStore();

  const [activeTab, setActiveTab] = useState<"events" | "leads" | "sequence">("events");
  
  // Event forms states
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventData, setNewEventData] = useState({
    name: "",
    type: "conference" as Event["type"],
    location: "",
    start_datetime: "",
    end_datetime: "",
    timezone: "America/New_York",
    description: "",
    internal_notes: "",
    website_url: "",
    cta_url: "",
  });

  // EventDay form states
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [newDayData, setNewDayData] = useState({
    day_number: "1",
    date: "",
    start_datetime: "",
    end_datetime: "",
  });

  // Edit Lead state
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editLeadData, setEditLeadData] = useState<Partial<Lead>>({});
  const [editEventLeadData, setEditEventLeadData] = useState<Partial<EventLead>>({});

  // Active Event Context
  const activeEvent = useMemo(() => events.find(e => e.id === currentEventId), [events, currentEventId]);
  const activeEventDays = useMemo(() => eventDays.filter(d => d.event_id === currentEventId), [eventDays, currentEventId]);

  // QR Code URL
  const qrUrl = useMemo(() => {
    if (!currentEventId) return "";
    const base = window.location.origin;
    return `${base}/register?eventId=${currentEventId}`;
  }, [currentEventId]);

  const qrImageUrl = useMemo(() => {
    if (!qrUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`;
  }, [qrUrl]);

  // Leads registered to active event
  const activeLeads = useMemo(() => {
    if (!currentEventId) return [];
    return eventLeads.filter(el => el.event_id === currentEventId).map(el => {
      const lead = leads.find(l => l.id === el.lead_id);
      return {
        ...el,
        leadDetails: lead
      };
    }).filter(el => el.leadDetails !== undefined);
  }, [eventLeads, leads, currentEventId]);

  // Handle Event Creation
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventData.name || !newEventData.start_datetime || !newEventData.end_datetime) return;

    const eventId = uuidv4();
    const newEvent: Event = {
      id: eventId,
      name: newEventData.name,
      type: newEventData.type,
      location: newEventData.location,
      start_datetime: newEventData.start_datetime,
      end_datetime: newEventData.end_datetime,
      timezone: newEventData.timezone,
      description: newEventData.description,
      internal_notes: newEventData.internal_notes || undefined,
      website_url: newEventData.website_url || undefined,
      cta_url: newEventData.cta_url || undefined,
      status: "scheduled",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addEvent(newEvent);
    await syncEventToFirebase(newEvent);
    setCurrentEvent(eventId);
    setShowAddEventModal(false);

    // Reset Form
    setNewEventData({
      name: "",
      type: "conference",
      location: "",
      start_datetime: "",
      end_datetime: "",
      timezone: "America/New_York",
      description: "",
      internal_notes: "",
      website_url: "",
      cta_url: "",
    });
  };

  // Handle Event Day Creation
  const handleCreateEventDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEventId || !newDayData.date || !newDayData.start_datetime || !newDayData.end_datetime) return;

    const dayId = uuidv4();
    const newDay: EventDay = {
      id: dayId,
      event_id: currentEventId,
      day_number: parseInt(newDayData.day_number) || 1,
      date: newDayData.date,
      start_datetime: newDayData.start_datetime,
      end_datetime: newDayData.end_datetime,
      status: "active",
    };

    addEventDay(newDay);
    await syncEventDayToFirebase(newDay);
    setShowAddDayModal(false);
    setNewDayData({
      day_number: String(activeEventDays.length + 2),
      date: "",
      start_datetime: "",
      end_datetime: "",
    });
  };

  // Handle Delete Event
  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm("Delete this event and all associated days? This cannot be undone.")) return;
    deleteEvent(id);
    await deleteEventFromFirebase(id);
  };

  // Handle Lead Edit Save
  const handleSaveLeadEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLeadId) return;

    updateLead(editingLeadId, editLeadData);
    await syncLeadToFirebase({ ...leads.find(l => l.id === editingLeadId)!, ...editLeadData });

    const eventLeadObj = eventLeads.find(el => el.event_id === currentEventId && el.lead_id === editingLeadId);
    if (eventLeadObj) {
      updateEventLead(eventLeadObj.id, editEventLeadData);
      await syncEventLeadToFirebase({ ...eventLeadObj, ...editEventLeadData });
    }

    setEditingLeadId(null);
  };

  // Handle Export CSV
  const handleExportCSV = () => {
    if (activeLeads.length === 0) return;
    const data = activeLeads.map(al => {
      const tickets = leaderboardEntries.filter(
        le => le.event_id === currentEventId && le.lead_id === al.lead_id
      ).length + 1;

      return {
        LeadID: al.lead_id,
        FirstName: al.leadDetails!.first_name,
        LastName: al.leadDetails!.last_name,
        Email: al.leadDetails!.email,
        Phone: al.leadDetails!.phone,
        Organization: al.leadDetails!.organization,
        Role: al.leadDetails!.role,
        SportOrIndustry: al.leadDetails!.sport_or_industry,
        AgeGroup: al.leadDetails!.age_group,
        EmailConsent: al.leadDetails!.consent_email ? "Yes" : "No",
        SMSConsent: al.leadDetails!.consent_sms ? "Yes" : "No",
        LeadSource: al.lead_source,
        StaffMember: al.staff_member || "",
        InterestLevel: al.interest_type || "",
        RaffleEligible: al.raffle_eligible ? "Yes" : "No",
        RaffleTickets: al.raffle_eligible ? tickets : 0,
        RaffleNumber: al.referral_code || "",
        BiggestChallenge: al.biggest_challenge || "",
        FollowUpStatus: al.follow_up_status,
        RegisteredAt: al.submission_timestamp,
      };
    });
    exportToCSV(`${activeEvent?.name.replace(/\s+/g, "_")}_leads.csv`, data);
  };

  // Post-Event Sequence Setup & Control
  const postEventSequence = useMemo(() => {
    return emailSequences.find(s => s.event_id === currentEventId);
  }, [emailSequences, currentEventId]);

  const handleToggleSequence = async () => {
    if (!currentEventId) return;
    if (postEventSequence) {
      const updated = { ...postEventSequence, status: (postEventSequence.status === "enabled" ? "disabled" : "enabled") as "enabled" | "disabled" };
      updateEmailSequence(postEventSequence.id, updated);
      await syncEmailSequenceToFirebase(updated);
    } else {
      const seqId = uuidv4();
      const newSeq: EmailSequence = {
        id: seqId,
        event_id: currentEventId,
        name: `${activeEvent?.name} Post-Event Drip`,
        status: "enabled",
        trigger_type: "event_end",
        trigger_offset: 0,
        created_at: new Date().toISOString(),
      };
      addEmailSequence(newSeq);
      await syncEmailSequenceToFirebase(newSeq);

      // Create standard message templates
      const messages = [
        { subject: "Ares Sports Vision Visual Resources", body: "Hi {{first_name}},\n\nThanks for participating in the Ares Vision Training Challenge at {{event_name}}!\n\nHere is your custom visual training playbook: {{cta_url}}.", offset: 0.16 }, // ~4 hours
        { subject: "Unlocking Your Visual Elite Advantage", body: "Hi {{first_name}},\n\nSports performance is 80% visual. By training your brain's processing speed, you make decisions faster. Let's schedule an individual evaluation: {{cta_url}}.", offset: 3 }, // 3 days
        { subject: "Case Study: Speed Up Decision Making", body: "Hi {{first_name}},\n\nCheck out how elite college programs use sports vision to reduce interceptions and improve hitting percentages: {{cta_url}}.", offset: 7 }, // 7 days
        { subject: "Ready to Level Up Your Game?", body: "Hi {{first_name}},\n\nDon't let visual fatigue hold you back. Schedule your team benchmark: {{cta_url}}.", offset: 14 }, // 14 days
        { subject: "Final Offer: Ares Sports Vision Performance Evaluation", body: "Hi {{first_name}},\n\nThis is your last chance to secure 15% off your first sports vision evaluation: {{cta_url}}.", offset: 30 } // 30 days
      ];

      for (const m of messages) {
        const msg: EmailMessage = {
          id: uuidv4(),
          sequence_id: seqId,
          subject: m.subject,
          body: m.body,
          send_offset: m.offset,
          status: "active",
        };
        addEmailMessage(msg);
        await syncEmailMessageToFirebase(msg);
      }
    }
  };

  const handleQueueEmails = async () => {
    if (!currentEventId || !postEventSequence) return;

    // Fetch message templates
    const messages = emailMessages.filter(m => m.sequence_id === postEventSequence.id);

    // Queue for each lead
    for (const al of activeLeads) {
      if (!al.leadDetails?.consent_email || al.follow_up_status === "converted" || al.follow_up_status === "unsubscribed") continue;

      // Check if already queued
      const alreadyQueued = emailLogs.some(log => log.event_id === currentEventId && log.lead_id === al.lead_id);
      if (alreadyQueued) continue;

      for (const msg of messages) {
        const logId = uuidv4();
        // Calculate sent_at based on event end time plus message offset in days
        const eventEnd = new Date(activeEvent!.end_datetime);
        const sendTime = new Date(eventEnd.getTime() + msg.send_offset * 24 * 60 * 60 * 1000);

        const newLog: EmailLog = {
          id: logId,
          event_id: currentEventId,
          lead_id: al.lead_id,
          message_id: msg.id,
          sent_at: sendTime.toISOString(),
          status: "scheduled",
        };
        addEmailLog(newLog);
        await syncEmailLogToFirebase(newLog);
      }

      // Update lead follow up status to sequence active
      updateEventLead(al.id, { follow_up_status: "sequence_active" });
      await syncEventLeadToFirebase({ ...al, follow_up_status: "sequence_active" });
    }

    alert(`Successfully queued post-event drip emails for ${activeLeads.length} leads.`);
  };

  const handleSendTestEmail = (email: string) => {
    alert(`[Simulate SMTP] Test follow-up email sequence sent to: ${email}`);
  };

  // Convert/Booked Action (opt-out sequence immediately)
  const handleUpdateBooking = async (elId: string, status: EventLead["follow_up_status"]) => {
    const el = eventLeads.find(x => x.id === elId);
    if (!el) return;

    updateEventLead(elId, { follow_up_status: status });
    await syncEventLeadToFirebase({ ...el, follow_up_status: status });

    // Cancel all scheduled email logs for this lead in this event
    const scheduledLogs = emailLogs.filter(log => log.event_id === currentEventId && log.lead_id === el.lead_id && log.status === "scheduled");
    for (const log of scheduledLogs) {
      const updatedLog = { ...log, status: (status === "converted" ? "replied" : "unsubscribed") as any };
      updateEmailLog(log.id, updatedLog);
      await syncEmailLogToFirebase(updatedLog);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2">
            Event Control Center
          </h2>
          <p className="text-[var(--color-ares-muted)] text-sm">
            Configure multi-day events, isolate leads and leaderboards, and launch follow-up drips.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowAddEventModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[var(--color-ares-teal)] text-white font-black tracking-widest text-xs uppercase rounded-xl hover:bg-opacity-95 glow-shadow transition-all"
          >
            <Plus size={16} /> Create Event
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-[var(--color-ares-dark-purple)] flex gap-8">
        <button
          onClick={() => setActiveTab("events")}
          className={`pb-4 uppercase tracking-widest text-xs font-bold transition-colors border-b-2 ${activeTab === 'events' ? 'text-[var(--color-ares-teal)] border-[var(--color-ares-teal)]' : 'text-[var(--color-ares-muted)] border-transparent hover:text-white'}`}
        >
          Event Management
        </button>
        <button
          onClick={() => setActiveTab("leads")}
          className={`pb-4 uppercase tracking-widest text-xs font-bold transition-colors border-b-2 ${activeTab === 'leads' ? 'text-[var(--color-ares-teal)] border-[var(--color-ares-teal)]' : 'text-[var(--color-ares-muted)] border-transparent hover:text-white'}`}
        >
          Lead Capture & Exports ({activeLeads.length})
        </button>
        <button
          onClick={() => setActiveTab("sequence")}
          className={`pb-4 uppercase tracking-widest text-xs font-bold transition-colors border-b-2 ${activeTab === 'sequence' ? 'text-[var(--color-ares-teal)] border-[var(--color-ares-teal)]' : 'text-[var(--color-ares-muted)] border-transparent hover:text-white'}`}
        >
          Email & SMS Campaigns
        </button>
      </div>

      {/* Events Configuration Tab */}
      {activeTab === "events" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List of Events */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-teal)] uppercase">All Events</h3>
            <div className="space-y-4">
              {events.map(e => (
                <div
                  key={e.id}
                  className={`p-6 bg-[var(--color-ares-charcoal)] border rounded-2xl transition-all relative overflow-hidden ${
                    currentEventId === e.id ? "border-[var(--color-ares-teal)] shadow-[0_0_20px_rgba(41,152,170,0.1)]" : "border-[var(--color-ares-dark-purple)]"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest bg-[var(--color-ares-teal)]/10 text-[var(--color-ares-teal)] px-2 py-0.5 rounded border border-[var(--color-ares-teal)]/20 mb-2 inline-block">
                        {e.type}
                      </span>
                      <h4 className="text-xl font-bold uppercase text-white tracking-tight">{e.name}</h4>
                      <p className="text-xs text-[var(--color-ares-muted)] flex items-center gap-1.5 mt-1">
                        <MapPin size={12} /> {e.location}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {currentEventId !== e.id && (
                        <button
                          onClick={() => setCurrentEvent(e.id)}
                          className="px-3 py-1.5 bg-[var(--color-ares-teal)]/10 hover:bg-[var(--color-ares-teal)] text-[var(--color-ares-teal)] hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-lg border border-[var(--color-ares-teal)]/20 transition-all cursor-pointer"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteEvent(e.id)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all border border-red-500/20 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-white/80 leading-relaxed font-light line-clamp-2 mb-4">{e.description}</p>

                  <div className="border-t border-[var(--color-ares-dark-purple)] pt-4 flex flex-wrap justify-between items-center gap-2 text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider font-bold">
                    <span>
                      Start: {new Date(e.start_datetime).toLocaleDateString()} · End: {new Date(e.end_datetime).toLocaleDateString()}
                    </span>
                    {currentEventId === e.id && (
                      <span className="text-[var(--color-ares-teal)] flex items-center gap-1">
                        <CheckCircle2 size={12} /> Currently Active Event
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Event Operations */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-teal)] uppercase">Active Event Operations</h3>
            {activeEvent ? (
              <div className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl p-6 space-y-6">
                {/* QR Code */}
                <div className="text-center space-y-4 pb-6 border-b border-[var(--color-ares-dark-purple)]">
                  <div className="inline-block p-3 bg-white rounded-2xl shadow-xl">
                    <img src={qrImageUrl} alt="Event Registration QR Code" className="w-40 h-40 mx-auto" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Registration Link</h4>
                    <p className="text-[10px] font-mono text-[var(--color-ares-muted)] truncate max-w-[240px] mx-auto mt-1">{qrUrl}</p>
                    <a
                      href={qrUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-ares-teal)] uppercase tracking-wider hover:underline mt-2"
                    >
                      Open Form <ExternalLink size={10} />
                    </a>
                  </div>
                </div>

                {/* Sub Days Setup */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Sub-Event Days ({activeEventDays.length})</h4>
                    <button
                      onClick={() => setShowAddDayModal(true)}
                      className="flex items-center gap-0.5 text-[9px] font-bold text-[var(--color-ares-teal)] uppercase"
                    >
                      <Plus size={10} /> Add Day
                    </button>
                  </div>

                  <div className="space-y-2">
                    {activeEventDays.map(d => (
                      <div key={d.id} className="p-3 bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white uppercase">Day {d.day_number}</p>
                          <p className="text-[10px] text-[var(--color-ares-muted)] font-mono">{d.date}</p>
                        </div>
                        <span className="text-[10px] font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl text-center text-xs text-[var(--color-ares-muted)]">
                Select or create an event to see QR and Day configurations.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lead Capture and Export Tab */}
      {activeTab === "leads" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-teal)] uppercase">
              Event Lead Database
            </h3>
            <button
              onClick={handleExportCSV}
              disabled={activeLeads.length === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--color-ares-teal)] text-white font-bold uppercase tracking-widest text-[10px] rounded-lg hover:bg-opacity-95 glow-shadow transition-all disabled:opacity-40"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--color-ares-bg)] text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] border-b border-[var(--color-ares-dark-purple)]">
                  <tr>
                    <th className="px-6 py-4 font-bold">Athlete</th>
                    <th className="px-6 py-4 font-bold">Sport / Organization</th>
                    <th className="px-6 py-4 font-bold">Contact Info</th>
                    <th className="px-6 py-4 font-bold">Insights & Interest</th>
                    <th className="px-6 py-4 font-bold">Source / Code</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-ares-dark-purple)]">
                  {activeLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-xs text-[var(--color-ares-muted)] uppercase tracking-wider font-bold">
                        No athletes have registered for this event yet.
                      </td>
                    </tr>
                  ) : (
                    activeLeads.map(al => (
                      <tr key={al.id} className="hover:bg-[var(--color-ares-bg)]/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-white uppercase tracking-tight">
                            {al.leadDetails!.first_name} {al.leadDetails!.last_name}
                          </p>
                          <p className="text-[10px] text-[var(--color-ares-muted)] uppercase">
                            {al.leadDetails!.role} · {al.leadDetails!.age_group}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white text-xs font-semibold">{al.leadDetails!.sport_or_industry}</p>
                          <p className="text-[10px] text-[var(--color-ares-muted)] uppercase">{al.leadDetails!.organization}</p>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-[var(--color-ares-muted)]">
                          <p>{al.leadDetails!.email}</p>
                          <p className="mt-0.5">{al.leadDetails!.phone}</p>
                        </td>
                        <td className="px-6 py-4 max-w-[200px]">
                          <p className="text-xs text-white line-clamp-1">{al.biggest_challenge || "No challenge noted"}</p>
                          <p className="text-[10px] text-[var(--color-ares-teal)] font-bold uppercase tracking-wider mt-0.5">
                            Interest: {al.interest_type}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-white">{al.lead_source}</p>
                          <p className="text-[10px] text-[var(--color-ares-purple)] font-bold font-mono">
                            Raffle: #{al.referral_code}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setEditingLeadId(al.lead_id);
                              setEditLeadData(al.leadDetails!);
                              setEditEventLeadData(al);
                            }}
                            className="p-2 text-[var(--color-ares-teal)] hover:bg-[var(--color-ares-teal)]/10 rounded-lg transition-colors border border-transparent hover:border-[var(--color-ares-teal)]/20"
                          >
                            <Edit size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Email and SMS Campaigns Tab */}
      {activeTab === "sequence" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Config drip templates */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--color-ares-dark-purple)] pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase">Automated Post-Event Drip Sequence</h4>
                  <p className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider mt-0.5">5-Step Email drip triggered on event end time</p>
                </div>
                <button
                  onClick={handleToggleSequence}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all border ${
                    postEventSequence
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "bg-[var(--color-ares-teal)]/10 border-[var(--color-ares-teal)]/30 text-[var(--color-ares-teal)]"
                  }`}
                >
                  {postEventSequence ? "Campaign Active" : "Initialize Campaign"}
                </button>
              </div>

              {postEventSequence ? (
                <div className="space-y-4">
                  {/* Sequence Stages */}
                  <div className="space-y-3">
                    <div className="p-3.5 bg-[var(--color-ares-bg)] rounded-xl border border-[var(--color-ares-dark-purple)]/50 text-xs flex gap-3">
                      <Mail size={16} className="text-[var(--color-ares-teal)] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white uppercase">Stage 1: Resource Playbook Play (4 Hours Post-Event)</p>
                        <p className="text-[10px] text-[var(--color-ares-muted)] mt-0.5">Includes custom resource link & vision playbook.</p>
                      </div>
                    </div>
                    <div className="p-3.5 bg-[var(--color-ares-bg)] rounded-xl border border-[var(--color-ares-dark-purple)]/50 text-xs flex gap-3">
                      <Mail size={16} className="text-[var(--color-ares-teal)] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white uppercase">Stage 2: Vision & Processing Speed Advantage (3 Days)</p>
                        <p className="text-[10px] text-[var(--color-ares-muted)] mt-0.5">Focuses on decision-making latency and cognitive skills.</p>
                      </div>
                    </div>
                    <div className="p-3.5 bg-[var(--color-ares-bg)] rounded-xl border border-[var(--color-ares-dark-purple)]/50 text-xs flex gap-3">
                      <Mail size={16} className="text-[var(--color-ares-teal)] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white uppercase">Stage 3: High Performance Case Studies (7 Days)</p>
                        <p className="text-[10px] text-[var(--color-ares-muted)] mt-0.5">Examines team testing results and professional metrics.</p>
                      </div>
                    </div>
                    <div className="p-3.5 bg-[var(--color-ares-bg)] rounded-xl border border-[var(--color-ares-dark-purple)]/50 text-xs flex gap-3">
                      <Mail size={16} className="text-[var(--color-ares-teal)] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white uppercase">Stage 4: Evaluation Booking Call-to-Action (14 Days)</p>
                        <p className="text-[10px] text-[var(--color-ares-muted)] mt-0.5">Link to book scheduling calendar.</p>
                      </div>
                    </div>
                    <div className="p-3.5 bg-[var(--color-ares-bg)] rounded-xl border border-[var(--color-ares-dark-purple)]/50 text-xs flex gap-3">
                      <Mail size={16} className="text-[var(--color-ares-teal)] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white uppercase">Stage 5: Final Discount Benchmark Offer (30 Days)</p>
                        <p className="text-[10px] text-[var(--color-ares-muted)] mt-0.5">Special 15% discount code for individual testing.</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[var(--color-ares-dark-purple)] pt-4">
                    <button
                      onClick={handleQueueEmails}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-ares-teal)] text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-opacity-95 glow-shadow transition-all"
                    >
                      <Play size={14} /> Queue & Start Campaign for {activeLeads.length} Leads
                    </button>
                    <p className="text-[9px] text-[var(--color-ares-muted)] text-center uppercase tracking-wider mt-2">Emails trigger relative to the event end date/time.</p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[var(--color-ares-muted)] uppercase tracking-wider font-bold">
                  Initialize post-event drip to start scheduling follow-ups automatically.
                </div>
              )}
            </div>

            {/* Campaign Logs */}
            {postEventSequence && (
              <div className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl p-6 space-y-4">
                <h4 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-purple)] uppercase">Campaign Send Queue / Logs</h4>
                <div className="overflow-x-auto border border-[var(--color-ares-dark-purple)]/50 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--color-ares-bg)] text-[9px] uppercase tracking-widest text-[var(--color-ares-muted)] border-b border-[var(--color-ares-dark-purple)]">
                      <tr>
                        <th className="px-4 py-3 font-bold">Recipient</th>
                        <th className="px-4 py-3 font-bold">Send Scheduled</th>
                        <th className="px-4 py-3 font-bold">Status</th>
                        <th className="px-4 py-3 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-ares-dark-purple)] text-white/90">
                      {emailLogs.filter(log => log.event_id === currentEventId).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider">
                            No scheduled messages in the queue yet. Click "Queue Campaign" above.
                          </td>
                        </tr>
                      ) : (
                        emailLogs.filter(log => log.event_id === currentEventId).map(log => {
                          const lead = leads.find(l => l.id === log.lead_id);
                          return (
                            <tr key={log.id} className="hover:bg-[var(--color-ares-bg)]/20 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-bold uppercase">{lead?.first_name} {lead?.last_name}</p>
                                <p className="text-[9px] text-[var(--color-ares-muted)] font-mono">{lead?.email}</p>
                              </td>
                              <td className="px-4 py-3 font-mono text-[10px]">
                                {new Date(log.sent_at).toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                                  log.status === "scheduled" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                                  log.status === "sent" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                                  log.status === "opened" ? "bg-teal-500/10 border-teal-500/20 text-[var(--color-ares-teal)]" :
                                  log.status === "unsubscribed" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                  "bg-green-500/10 border-green-500/20 text-green-400"
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleSendTestEmail(lead!.email)}
                                  className="p-1 hover:bg-[var(--color-ares-bg)] text-[var(--color-ares-teal)] hover:text-white rounded border border-transparent hover:border-[var(--color-ares-teal)]/20 transition-all cursor-pointer"
                                  title="Send Test"
                                >
                                  <TestTube size={12} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Opt out controls */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-teal)] uppercase">Opt-Out & Booking Controls</h3>
            <div className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl p-6 space-y-4">
              <p className="text-[10px] text-[var(--color-ares-muted)] leading-relaxed uppercase tracking-wider font-bold">Update Lead Status (Manual Opt-out/Conversion)</p>
              
              <div className="space-y-3">
                {activeLeads.map(al => (
                  <div key={al.id} className="p-3 bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)]/50 rounded-xl flex items-center justify-between text-xs">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold text-white uppercase truncate">{al.leadDetails!.first_name} {al.leadDetails!.last_name}</p>
                      <p className="text-[9px] text-[var(--color-ares-muted)] truncate">Campaign: {al.follow_up_status}</p>
                    </div>
                    
                    <div className="flex gap-1.5">
                      {al.follow_up_status !== "converted" && (
                        <button
                          onClick={() => handleUpdateBooking(al.id, "converted")}
                          className="p-1 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white rounded border border-green-500/20 cursor-pointer"
                          title="Mark Converted (Stops emails)"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      {al.follow_up_status !== "unsubscribed" && (
                        <button
                          onClick={() => handleUpdateBooking(al.id, "unsubscribed")}
                          className="p-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded border border-red-500/20 cursor-pointer"
                          title="Unsubscribe (Stops emails)"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-[var(--color-ares-bg)]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateEvent} className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] p-8 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight border-b border-[var(--color-ares-dark-purple)] pb-3 mb-2">Create New Event</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Event Name *</label>
                <input required type="text" value={newEventData.name} onChange={e => setNewEventData(p => ({ ...p, name: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" placeholder="e.g. Ares Summer Vision Challenge 2026" />
              </div>
              
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Event Type *</label>
                <select value={newEventData.type} onChange={e => setNewEventData(p => ({ ...p, type: e.target.value as any }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm">
                  <option value="conference">Conference</option>
                  <option value="trade show">Trade Show</option>
                  <option value="team event">Team Event</option>
                  <option value="clinic">Clinic</option>
                  <option value="speaking event">Speaking Event</option>
                  <option value="internal demo">Internal Demo</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Location *</label>
                <input required type="text" value={newEventData.location} onChange={e => setNewEventData(p => ({ ...p, location: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" placeholder="e.g. Las Vegas, NV" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Start Date & Time *</label>
                <input required type="datetime-local" value={newEventData.start_datetime} onChange={e => setNewEventData(p => ({ ...p, start_datetime: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">End Date & Time *</label>
                <input required type="datetime-local" value={newEventData.end_datetime} onChange={e => setNewEventData(p => ({ ...p, end_datetime: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">CTA Resource URL</label>
                <input type="url" value={newEventData.cta_url} onChange={e => setNewEventData(p => ({ ...p, cta_url: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" placeholder="e.g. https://ares.academy/playbook" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Timezone</label>
                <select value={newEventData.timezone} onChange={e => setNewEventData(p => ({ ...p, timezone: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm">
                  <option value="America/New_York">Eastern (EST/EDT)</option>
                  <option value="America/Chicago">Central (CST/CDT)</option>
                  <option value="America/Denver">Mountain (MST/MDT)</option>
                  <option value="America/Los_Angeles">Pacific (PST/PDT)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Description / Notes</label>
              <textarea value={newEventData.description} onChange={e => setNewEventData(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" placeholder="Details about this show..." />
            </div>

            <div className="flex gap-4 pt-4 border-t border-[var(--color-ares-dark-purple)]">
              <button
                type="button"
                onClick={() => setShowAddEventModal(false)}
                className="flex-1 py-3 bg-[var(--color-ares-bg)] text-white rounded-xl font-bold uppercase tracking-widest text-xs border border-[var(--color-ares-dark-purple)] hover:bg-[var(--color-ares-dark-purple)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[var(--color-ares-teal)] text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-opacity-95 transition-colors"
              >
                Save Event
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Day Modal */}
      {showAddDayModal && (
        <div className="fixed inset-0 bg-[var(--color-ares-bg)]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateEventDay} className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] p-8 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Add Event Day</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Day Number</label>
                <input required type="number" value={newDayData.day_number} onChange={e => setNewDayData(p => ({ ...p, day_number: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
              
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Date</label>
                <input required type="date" value={newDayData.date} onChange={e => setNewDayData(p => ({ ...p, date: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Day Start</label>
                <input required type="time" value={newDayData.start_datetime} onChange={e => setNewDayData(p => ({ ...p, start_datetime: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
              
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Day End</label>
                <input required type="time" value={newDayData.end_datetime} onChange={e => setNewDayData(p => ({ ...p, end_datetime: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-[var(--color-ares-dark-purple)]">
              <button
                type="button"
                onClick={() => setShowAddDayModal(false)}
                className="flex-1 py-3 bg-[var(--color-ares-bg)] text-white rounded-xl font-bold uppercase tracking-widest text-xs border border-[var(--color-ares-dark-purple)] hover:bg-[var(--color-ares-dark-purple)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[var(--color-ares-teal)] text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-opacity-95 transition-colors"
              >
                Save Day
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editingLeadId && (
        <div className="fixed inset-0 bg-[var(--color-ares-bg)]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveLeadEdit} className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] p-8 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Edit Lead Info</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">First Name</label>
                <input required type="text" value={editLeadData.first_name || ""} onChange={e => setEditLeadData(p => ({ ...p, first_name: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Last Name</label>
                <input required type="text" value={editLeadData.last_name || ""} onChange={e => setEditLeadData(p => ({ ...p, last_name: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Email</label>
                <input required type="email" value={editLeadData.email || ""} onChange={e => setEditLeadData(p => ({ ...p, email: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Phone</label>
                <input required type="tel" value={editLeadData.phone || ""} onChange={e => setEditLeadData(p => ({ ...p, phone: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Organization</label>
                <input required type="text" value={editLeadData.organization || ""} onChange={e => setEditLeadData(p => ({ ...p, organization: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Sport / Industry</label>
                <input required type="text" value={editLeadData.sport_or_industry || ""} onChange={e => setEditLeadData(p => ({ ...p, sport_or_industry: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Biggest Challenge</label>
                <input type="text" value={editEventLeadData.biggest_challenge || ""} onChange={e => setEditEventLeadData(p => ({ ...p, biggest_challenge: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Staff Member</label>
                <input type="text" value={editEventLeadData.staff_member || ""} onChange={e => setEditEventLeadData(p => ({ ...p, staff_member: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-[var(--color-ares-dark-purple)]">
              <button
                type="button"
                onClick={() => setEditingLeadId(null)}
                className="flex-1 py-3 bg-[var(--color-ares-bg)] text-white rounded-xl font-bold uppercase tracking-widest text-xs border border-[var(--color-ares-dark-purple)] hover:bg-[var(--color-ares-dark-purple)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[var(--color-ares-teal)] text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-opacity-95 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
