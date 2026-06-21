import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import DashboardLayout from "../components/DashboardLayout";
import MetricCard from "../components/MetricCard";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";

const initialProfile = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  pincode: "",
};

const sampleBookingHistory = [
  {
    id: 101,
    consumer_name: "Raj Kumar",
    state: "Maharashtra",
    district: "Mumbai",
    distributor_id: 1,
    pincode: "400001",
    status: "Pending",
  },
  {
    id: 102,
    consumer_name: "Priya Singh",
    state: "Delhi",
    district: "South Delhi",
    distributor_id: 2,
    pincode: "110016",
    status: "Approved",
  },
  {
    id: 103,
    consumer_name: "Amit Patel",
    state: "Gujarat",
    district: "Ahmedabad",
    distributor_id: 3,
    pincode: "380001",
    status: "Shipped",
  },
  {
    id: 104,
    consumer_name: "Neha Verma",
    state: "West Bengal",
    district: "Kolkata",
    distributor_id: 4,
    pincode: "700001",
    status: "Completed",
  },
  {
    id: 105,
    consumer_name: "Suresh Nair",
    state: "Kerala",
    district: "Thiruvananthapuram",
    distributor_id: 5,
    pincode: "695001",
    status: "Rejected",
  },
  {
    id: 106,
    consumer_name: "Raj Kumar",
    state: "Maharashtra",
    district: "Pune",
    distributor_id: 1,
    pincode: "411001",
    status: "Completed",
  },
  {
    id: 107,
    consumer_name: "Priya Singh",
    state: "Delhi",
    district: "North Delhi",
    distributor_id: 2,
    pincode: "110007",
    status: "Shipped",
  },
];

const sampleComplaints = [
  {
    id: 201,
    consumer_name: "Raj Kumar",
    state: "Maharashtra",
    district: "Mumbai",
    subject: "Delayed refill",
    details: "Cylinder delivery was delayed and the customer was not notified.",
    submittedAt: "2026-06-19 09:34",
    status: "Open",
  },
  {
    id: 202,
    consumer_name: "Priya Singh",
    state: "Delhi",
    district: "South Delhi",
    subject: "Distributor mismatch",
    details: "Received wrong distributor details in the booking confirmation.",
    submittedAt: "2026-06-20 10:15",
    status: "In Progress",
  },
  {
    id: 203,
    consumer_name: "Neha Verma",
    state: "West Bengal",
    district: "Kolkata",
    subject: "Poor cylinder condition",
    details: "Cylinder seal was broken on arrival.",
    submittedAt: "2026-06-20 16:50",
    status: "Resolved",
  },
];

const sampleRefundRequests = [
  {
    id: 301,
    bookingRef: "103",
    amount: "500",
    reason: "Cylinder arrival was damaged.",
    submittedAt: "2026-06-20 11:12",
    status: "Under Review",
  },
  {
    id: 302,
    bookingRef: "104",
    amount: "380",
    reason: "Delayed delivery caused inconvenience.",
    submittedAt: "2026-06-20 16:20",
    status: "Approved",
  },
  {
    id: 303,
    bookingRef: "105",
    amount: "420",
    reason: "Wrong distributor assigned to my order.",
    submittedAt: "2026-06-21 09:30",
    status: "Pending",
  },
];

const sampleDistributors = [
  { id: 1, name: "Mumbai LPG Distribution", state: "Maharashtra", district: "Mumbai" },
  { id: 2, name: "Delhi LPG Supply Co", state: "Delhi", district: "South Delhi" },
  { id: 3, name: "Gujarat Gas Agency", state: "Gujarat", district: "Ahmedabad" },
  { id: 4, name: "Kolkata Cylinder Works", state: "West Bengal", district: "Kolkata" },
  { id: 5, name: "Kerala Energy Hub", state: "Kerala", district: "Thiruvananthapuram" },
];

function ConsumerPortal({ onBackToHome }) {
  const [activeView, setActiveView] = useState("booking");
  const [consumerName, setConsumerName] = useState("");
  const [stateName, setStateName] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [selectedDistributor, setSelectedDistributor] = useState("");
  const [pincode, setPincode] = useState("");
  const [distributors, setDistributors] = useState([]);
  const [bookingHistory, setBookingHistory] = useState(sampleBookingHistory);
  const [complaints, setComplaints] = useState(sampleComplaints);
  const [refundRequests, setRefundRequests] = useState(sampleRefundRequests);
  const [complaintForm, setComplaintForm] = useState({
    subject: "",
    details: "",
  });
  const [refundForm, setRefundForm] = useState({
    bookingRef: "",
    amount: "",
    reason: "",
  });
  const [profile, setProfile] = useState(initialProfile);

  const districts = {
    Maharashtra: ["Mumbai", "Pune", "Nagpur"],
    Delhi: ["South Delhi", "North Delhi", "New Delhi"],
    Gujarat: ["Ahmedabad", "Surat", "Vadodara"],
    Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode"],
    "West Bengal": ["Kolkata", "Howrah", "Darjeeling"],
    Karnataka: ["Bengaluru", "Mysuru", "Mangalore"],
  };

  const navItems = [
    { id: "booking", label: "New Booking", description: "Create a refill request", icon: "01" },
    { id: "history", label: "Booking History", description: "Track your latest status", icon: "02" },
    { id: "complaints", label: "Complaint Section", description: "Raise a service issue", icon: "03" },
    { id: "refunds", label: "Refund Request", description: "Submit a refund case", icon: "04" },
    { id: "profile", label: "Profile Page", description: "Maintain account details", icon: "05" },
  ];

  useEffect(() => {
    fetchDistributors();

    const savedProfile = window.localStorage.getItem("consumerProfile");
    const savedLookupName =
      window.localStorage.getItem("consumerLookupName") ||
      window.localStorage.getItem("consumerName");

    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile({ ...initialProfile, ...parsedProfile });

        if (parsedProfile.name) {
          setConsumerName(parsedProfile.name);
        }
      } catch (error) {
        console.log(error);
      }
    }

    if (savedLookupName) {
      setConsumerName(savedLookupName);
      fetchBookingHistory(savedLookupName);
    }
  }, []);

  async function fetchDistributors() {
    const { data, error } = await supabase.from("distributors").select("*");

    if (error || !data?.length) {
      console.log(error);
      setDistributors(sampleDistributors);
    } else {
      setDistributors(data || sampleDistributors);
    }
  }

  async function fetchBookingHistory(consumerLookupName) {
    if (!consumerLookupName) {
      setBookingHistory([]);
      return;
    }

    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .eq("consumer_name", consumerLookupName)
      .order("id", { ascending: false });

    if (error) {
      console.log(error);
    } else {
      setBookingHistory(data || []);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (
    !consumerName.trim() ||
    !stateName ||
    !districtName ||
    !selectedDistributor ||
    !pincode.trim()
  ) {
    alert("Please fill all fields");
    return;
  }

    const { error } = await supabase.from("requests").insert([
      {
        consumer_name: consumerName,
        state: stateName,
        district: districtName,
        distributor_id: Number(selectedDistributor),
        pincode: pincode,
        status: "Pending",
      },
    ]);

    if (error) {
      console.log(error);
      alert("Request Failed");
      return;
    }

    const nextProfile = {
      ...profile,
      name: consumerName,
      state: stateName,
      district: districtName,
      pincode,
    };

    setProfile(nextProfile);
    window.localStorage.setItem("consumerProfile", JSON.stringify(nextProfile));
    window.localStorage.setItem("consumerLookupName", consumerName);
    await fetchBookingHistory(consumerName);

    alert("Refill request submitted successfully");

    setStateName("");
    setDistrictName("");
    setSelectedDistributor("");
    setPincode("");
  }

  function handleComplaintSubmit(e) {
    e.preventDefault();

    if (!complaintForm.subject.trim() || !complaintForm.details.trim()) {
      alert("Please fill all  complaint details");
      return;
    }

    setComplaints((current) => [
      {
        ...complaintForm,
        id: Date.now(),
        status: "Open",
        submittedAt: new Date().toLocaleString(),
      },
      ...current,
    ]);

    setComplaintForm({ subject: "", details: "" });
  }

  function handleRefundSubmit(e) {
    e.preventDefault();

    if (!refundForm.bookingRef.trim() || !refundForm.reason.trim()) {
      alert("Please fill all refund details");
      return;
    }

    setRefundRequests((current) => [
      {
        ...refundForm,
        id: Date.now(),
        status: "Under Review",
        submittedAt: new Date().toLocaleString(),
      },
      ...current,
    ]);

    setRefundForm({ bookingRef: "", amount: "", reason: "" });
  }

  function handleProfileSave(e) {
    e.preventDefault();

    const nextProfile = {
      ...profile,
      name: profile.name.trim(),
    };

    setProfile(nextProfile);
    window.localStorage.setItem("consumerProfile", JSON.stringify(nextProfile));
    window.localStorage.setItem("consumerLookupName", nextProfile.name);

    if (nextProfile.name) {
      setConsumerName(nextProfile.name);
      fetchBookingHistory(nextProfile.name);
    }

    alert("Profile saved");
  }

  const filteredDistributors = distributors.filter(
    (distributor) =>
      districtName &&
      distributor.district?.toLowerCase() === districtName.toLowerCase()
  );

  const bookingStats = [
    { label: "Tracked requests", value: bookingHistory.length, description: "Requests matched by consumer name", tone: "blue" },
    { label: "Open complaints", value: complaints.length, description: "Locally captured support cases", tone: "orange" },
    { label: "Refund cases", value: refundRequests.length, description: "Pending refund submissions", tone: "green" },
  ];

  const topbarAction = (
  <button
    type="button"
    className="secondary-button"
    onClick={() => {
      localStorage.clear();
      window.location.reload();
    }}
  >
    Logout
  </button>
);

  const sidebarFooter = (
    <button type="button" className="ghost-button sidebar-footer-button" onClick={onBackToHome}>
      Exit consumer workspace
    </button>
  );

  return (
    <DashboardLayout
      brand="Consumer Dashboard"
      title="Manage your gas service from one workspace"
      subtitle="Book refills, review request status, and keep service details current without changing the existing Supabase workflow."
      navItems={navItems}
      activeView={activeView}
      onViewChange={setActiveView}
      topbarAction={topbarAction}
      sidebarFooter={sidebarFooter}
    >
      {activeView === "booking" ? (
        <div className="dashboard-grid dashboard-grid-wide">
          <div className="stacked-cards">
            <div className="metric-grid">
              {bookingStats.map((item) => (
                <MetricCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  description={item.description}
                  tone={item.tone}
                />
              ))}
            </div>

            <SectionCard
              eyebrow="New Booking"
              title="Submit a refill request"
              description="The request is saved to the existing requests table with the assigned distributor id and pending status."
            >
              <form className="dashboard-form" onSubmit={handleSubmit}>
                <div className="form-grid two-col">
                  <label className="field">
                    <span>Consumer Name</span>
                    <input
                      type="text"
                      value={consumerName}
                      onChange={(e) => setConsumerName(e.target.value)}
                      placeholder="Enter consumer name"
                      className="text-input"
                    />
                  </label>

                  <label className="field">
                    <span>State</span>
                    <select
                      value={stateName}
                      onChange={(e) => {
                        setStateName(e.target.value);
                        setDistrictName("");
                        setSelectedDistributor("");
                      }}
                      className="text-input"
                    >
                      <option value="">Select state</option>
                      <option>Himachal Pradesh</option>
                      <option>Kerala</option>
                      <option>West Bengal</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>District</span>
                    <select
                      value={districtName}
                      onChange={(e) => {
                        setDistrictName(e.target.value);
                        setSelectedDistributor("");
                      }}
                      className="text-input"
                    >
                      <option value="">Select district</option>
                     {stateName && districts[stateName]
  ? districts[stateName].map((district) => (
                            <option key={district} value={district}>
                              {district}
                            </option>
                          ))
                        : null}
                    </select>
                  </label>

                  <label className="field">
                    <span>Distributor</span>
                    <select
                      value={selectedDistributor}
                      onChange={(e) => setSelectedDistributor(e.target.value)}
                      className="text-input"
                    >
                      <option value="">Select distributor</option>
                      {filteredDistributors.map((distributor) => (
                        <option key={distributor.id} value={distributor.id}>
                          {distributor.name || distributor.agency_name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Pincode</span>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="Enter pincode"
                      className="text-input"
                    />
                  </label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="primary-button">
                    Request Refill
                  </button>
                </div>
              </form>
            </SectionCard>
          </div>

          <SectionCard
            eyebrow="Current Profile"
            title="Booking identity"
            description="History is matched from the consumer name so the same record can be reviewed later."
            compact
          >
            <div className="profile-summary">
              <p><strong>Name:</strong> {profile.name || consumerName || "Not set"}</p>
              <p><strong>State:</strong> {profile.state || stateName || "Not set"}</p>
              <p><strong>District:</strong> {profile.district || districtName || "Not set"}</p>
              <p><strong>Pincode:</strong> {profile.pincode || pincode || "Not set"}</p>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {activeView === "history" ? (
        <SectionCard
          eyebrow="Booking History"
          title="Request timeline"
          description="Every booking made under the saved consumer name appears here with its latest status."
        >
          {bookingHistory.length === 0 ? (
            <div className="empty-state">
              <h3>No booking history yet</h3>
              <p>Save your consumer name in Profile or submit a new booking to start tracking requests.</p>
            </div>
          ) : (
            <div className="record-grid">
              {bookingHistory.map((request) => (
                <article key={request.id} className="record-card">
                  <div className="record-card-header">
                    <div>
                      <p className="record-label">Request #{request.id}</p>
                      <strong>{request.consumer_name}</strong>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  <div className="record-details">
                    <p><span>State</span>{request.state || "-"}</p>
                    <p><span>District</span>{request.district || "-"}</p>
                    <p><span>Distributor</span>{request.distributor_id || "-"}</p>
                    <p><span>Pincode</span>{request.pincode || "-"}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionCard>
      ) : null}

      {activeView === "complaints" ? (
        <div className="dashboard-grid">
          <SectionCard
            eyebrow="Complaint Section"
            title="Report a service issue"
            description="Use this area to capture support problems while keeping the request flow unchanged."
          >
            <form className="dashboard-form" onSubmit={handleComplaintSubmit}>
              <div className="form-grid">
                <label className="field">
                  <span>Subject</span>
                  <input
                    type="text"
                    value={complaintForm.subject}
                    onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                    placeholder="Complaint subject"
                    className="text-input"
                  />
                </label>

                <label className="field field-full">
                  <span>Details</span>
                  <textarea
                    rows="6"
                    value={complaintForm.details}
                    onChange={(e) => setComplaintForm({ ...complaintForm, details: e.target.value })}
                    placeholder="Describe the issue in detail"
                    className="text-input"
                  />
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-button">
                  Raise Complaint
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            eyebrow="Open Cases"
            title="Recent complaint activity"
            description="These entries remain local to the browser so the support panel can be used without changing the database schema."
            compact
          >
            {complaints.length === 0 ? (
              <div className="empty-state compact">
                <h3>No complaints submitted</h3>
                <p>Log the first support case from the form to the left.</p>
              </div>
            ) : (
              <div className="record-list">
                {complaints.map((complaint) => (
                  <article key={complaint.id} className="support-card">
                    <div className="record-card-header">
                      <div>
                        <p className="record-label">{complaint.subject}</p>
                        <strong>{complaint.submittedAt}</strong>
                      </div>
                      <StatusBadge status={complaint.status} />
                    </div>
                    <p className="support-copy">{complaint.details}</p>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      ) : null}

      {activeView === "refunds" ? (
        <div className="dashboard-grid">
          <SectionCard
            eyebrow="Refund Request Section"
            title="Submit a refund case"
            description="Capture refund details alongside the booking reference for support follow-up."
          >
            <form className="dashboard-form" onSubmit={handleRefundSubmit}>
              <div className="form-grid two-col">
                <label className="field">
                  <span>Booking Reference</span>
                  <input
                    type="text"
                    value={refundForm.bookingRef}
                    onChange={(e) => setRefundForm({ ...refundForm, bookingRef: e.target.value })}
                    placeholder="Booking reference"
                    className="text-input"
                  />
                </label>

                <label className="field">
                  <span>Amount</span>
                  <input
                    type="text"
                    value={refundForm.amount}
                    onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                    placeholder="Refund amount"
                    className="text-input"
                  />
                </label>

                <label className="field field-full">
                  <span>Reason</span>
                  <textarea
                    rows="6"
                    value={refundForm.reason}
                    onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                    placeholder="Explain why the refund is required"
                    className="text-input"
                  />
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-button">
                  Request Refund
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            eyebrow="Submitted Refunds"
            title="Local refund queue"
            description="Refund requests can be reviewed here before they are handled by support staff."
            compact
          >
            {refundRequests.length === 0 ? (
              <div className="empty-state compact">
                <h3>No refund requests yet</h3>
                <p>Use the form to create the first refund case.</p>
              </div>
            ) : (
              <div className="record-list">
                {refundRequests.map((refund) => (
                  <article key={refund.id} className="support-card">
                    <div className="record-card-header">
                      <div>
                        <p className="record-label">Booking {refund.bookingRef}</p>
                        <strong>Requested on {refund.submittedAt}</strong>
                      </div>
                      <StatusBadge status={refund.status} />
                    </div>
                    <p className="support-copy">{refund.reason}</p>
                    <p className="support-copy muted">Amount: {refund.amount || "Not provided"}</p>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      ) : null}

      {activeView === "profile" ? (
        <div className="dashboard-grid">
          <SectionCard
            eyebrow="Profile Page"
            title="Maintain consumer profile details"
            description="Keep identity and contact information ready for future refill requests and service follow-up."
          >
            <form className="dashboard-form" onSubmit={handleProfileSave}>
              <div className="form-grid two-col">
                <label className="field">
                  <span>Full Name</span>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Consumer name"
                    className="text-input"
                  />
                </label>
                <label className="field">
                  <span>Phone Number</span>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="Mobile number"
                    className="text-input"
                  />
                </label>
                <label className="field">
                  <span>Email Address</span>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="Email address"
                    className="text-input"
                  />
                </label>
                <label className="field">
                  <span>City</span>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    placeholder="City"
                    className="text-input"
                  />
                </label>
                <label className="field field-full">
                  <span>Address</span>
                  <textarea
                    rows="5"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder="Residential address"
                    className="text-input"
                  />
                </label>
                <label className="field">
                  <span>Pincode</span>
                  <input
                    type="text"
                    value={profile.pincode}
                    onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                    placeholder="Pincode"
                    className="text-input"
                  />
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-button">
                  Save Profile
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            eyebrow="Saved Snapshot"
            title="Profile summary"
            description="The saved profile is reused when matching the consumer booking history."
            compact
          >
            <div className="profile-summary vertical">
              <p><strong>Name:</strong> {profile.name || "Not set"}</p>
              <p><strong>Phone:</strong> {profile.phone || "Not set"}</p>
              <p><strong>Email:</strong> {profile.email || "Not set"}</p>
              <p><strong>City:</strong> {profile.city || "Not set"}</p>
              <p><strong>Address:</strong> {profile.address || "Not set"}</p>
              <p><strong>Pincode:</strong> {profile.pincode || "Not set"}</p>
            </div>
          </SectionCard>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

export default ConsumerPortal;