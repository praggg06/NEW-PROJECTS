import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import DashboardLayout from "../components/DashboardLayout";
import MetricCard from "../components/MetricCard";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";



function ConsumerPortal({ onBackToHome }) {
  const consumerId =
  localStorage.getItem("consumerId");
  const [consumerData, setConsumerData] =
  useState(null);

  async function fetchConsumerData() {
  const consumerNumber =
    localStorage.getItem("consumerNumber");
  
  const { data, error } = await supabase
    .from("consumers")
    .select("*")
    .eq("consumer_number", consumerNumber)
    .single();

  if (error) {
    console.log(error);
    return;
  }

  setConsumerData(data);
}


  const [activeView, setActiveView] = useState("booking");
  const [bookingHistory, setBookingHistory] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [showConfirmBox, setShowConfirmBox] =
  useState(false);
  
  const [complaintForm, setComplaintForm] = useState({
    subject: "",
    details: "",
  });

  const districts = {
    "Himachal Pradesh": ["Shimla", "Solan", "Bilaspur"],
    Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode"],
    "West Bengal": ["Kolkata", "Howrah", "Darjeeling"],
  };

  const navItems = [
  {
    id: "booking",
    label: "Book Cylinder",
    description: "Submit LPG refill request",
    icon: "01",
  },
  {
    id: "history",
    label: "Booking History",
    description: "Track request status",
    icon: "02",
  },
  {
    id: "complaints",
    label: "Support",
    description: "Raise service issues",
    icon: "03",
  },
  {
    id: "profile",
    label: "Profile",
    description: "Manage account details",
    icon: "04",
  },
];


  

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
  async function fetchComplaints(
  consumerName
) {

  const { data, error } =
    await supabase
      .from("complaints")
      .select("*")
      .eq(
        "consumer_name",
        consumerName
      )
      .order("id", {
        ascending: false,
      });

  if (!error) {
    setComplaints(data || []);
  }

}
useEffect(() => {

  fetchConsumerData();

  const consumerName =
    localStorage.getItem("consumerName");

  fetchBookingHistory(
    consumerName
  );

}, []);


 async function handleSubmit() {

  const existingPending =
  bookingHistory.some(
    (item) =>
      item.status === "Pending"
  );

if (existingPending) {
  alert(
    "You already have a pending refill request."
  );
  return;
}
console.log("Consumer Data:", consumerData);
  const { error } = await supabase
  .from("requests")
  .insert([
    {
      consumer_name:
        consumerData.consumer_name,

      state:
        consumerData.state,

      district:
        consumerData.district,

      pincode:
        consumerData.pincode,

      assigned_distributor:
        consumerData.assigned_distributor,

      status: "Pending",
    },
  ]);

 if (error) {
  console.log("FULL ERROR:", error);

  alert(JSON.stringify(error));

  return;
}

  alert(
    "Refill Request Submitted Successfully"
  );
setShowConfirmBox(false);
  fetchBookingHistory(
    consumerData.consumer_name
  );
}

  async function handleComplaintSubmit(e) {
  e.preventDefault();

  if (
    !complaintForm.subject.trim() ||
    !complaintForm.details.trim()
  ) {
    alert("Please fill all complaint details");
    return;
  }

  const { error } = await supabase
    .from("complaints")
    .insert([
      {
        consumer_name:
          consumerData.consumer_name,

        assigned_distributor:
          consumerData.assigned_distributor,

        subject:
          complaintForm.subject,

        details:
          complaintForm.details,

        status: "Pending",
      },
    ]);

  if (error) {
  console.log(error);

  alert(
    JSON.stringify(error)
  );

  return;
}

  alert("Complaint Submitted");
  fetchComplaints(
  consumerData.consumer_name
);

  setComplaintForm({
    subject: "",
    details: "",
  });
}

  const bookingStats = [
  {
    label: "Total Bookings",
    value: bookingHistory.length,
    description: "Cylinder refill requests",
    tone: "blue",
  },
  {
    label: "Pending",
    value: bookingHistory.filter(
      (item) => item.status === "Pending"
    ).length,
    description: "Awaiting processing",
    tone: "orange",
  },
  {
    label: "Delivered",
    value: bookingHistory.filter(
      (item) => item.status === "Delivered"
    ).length,
    description: "Completed deliveries",
    tone: "green",
  },
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

  const sidebarFooter = null;

  return (
    <DashboardLayout
      brand="Consumer Dashboard"
     title="LPG Consumer Dashboard"
subtitle="Book LPG refills, track delivery status, and manage your account."
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
  eyebrow="BOOK CYLINDER"
  title="Book LPG Cylinder"
  description="Submit a refill request and track its status from Booking History."
>
 <>
  <div className="metric-grid">

    <MetricCard
      label="Consumer ID"
      value={consumerData?.consumer_number || "-"}
      tone="blue"
    />

    <MetricCard
      label="Distributor"
      value={consumerData?.assigned_distributor || "-"}
      tone="green"
    />

    <MetricCard
      label="Phone"
      value={consumerData?.phone || "-"}
      tone="orange"
    />

    <MetricCard
      label="District"
      value={consumerData?.district || "-"}
      tone="blue"
    />

    <MetricCard
      label="Village/city"
      value={consumerData?.["village/city"] || "-"}
      tone="green"
    />

    <MetricCard
      label="Pincode"
      value={consumerData?.pincode || "-"}
      tone="orange"
    />

  </div>

  <div style={{ marginTop: "30px" }}>
    <button
      className="primary-button"
      onClick={() => setShowConfirmBox(true)}
    >
      Request Refill
    </button>
    {showConfirmBox && (
  <div
    style={{
      marginTop: "20px",
      padding: "20px",
      borderRadius: "12px",
      background: "#0C1D35",
      border: "1px solid rgba(255,255,255,0.08)",
    }}
  >
    <h3>Confirm Refill Request</h3>

    <p>
      Consumer ID:
      {" "}
      {consumerData?.consumer_number}
    </p>

    <p>
      Distributor:
      {" "}
      {consumerData?.assigned_distributor}
    </p>

    <p>
      Area:
      {" "}
      {consumerData?.["village/city"]},
      {" "}
      {consumerData?.district}
    </p>

    <div
      style={{
        display: "flex",
        gap: "10px",
        marginTop: "15px",
      }}
    >
      <button
        className="secondary-button"
        onClick={() =>
          setShowConfirmBox(false)
        }
      >
        Cancel
      </button>

      <button
        className="primary-button"
        onClick={handleSubmit}
      >
        Confirm Request
      </button>
    </div>
  </div>
)}
  </div>

</>
</SectionCard>
          </div>
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
                    <p>
  <span>Distributor</span>
  {request.assigned_distributor || "-"}
</p>
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
      description="Raise a complaint directly with your assigned distributor."
    >
      <form
        className="dashboard-form"
        onSubmit={handleComplaintSubmit}
      >
        <div className="form-grid">

          <label className="field">
            <span>Subject</span>
            <input
              type="text"
              value={complaintForm.subject}
              onChange={(e) =>
                setComplaintForm({
                  ...complaintForm,
                  subject: e.target.value,
                })
              }
              placeholder="Complaint subject"
              className="text-input"
            />
          </label>

          <label className="field field-full">
            <span>Details</span>
            <textarea
              rows="6"
              value={complaintForm.details}
              onChange={(e) =>
                setComplaintForm({
                  ...complaintForm,
                  details: e.target.value,
                })
              }
              placeholder="Describe the issue"
              className="text-input"
            />
          </label>

        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="primary-button"
          >
            Raise Complaint
          </button>
        </div>
      </form>
    </SectionCard>

    <SectionCard
      eyebrow="Complaint History"
      title="Your Complaints"
      description="Track complaint status."
      compact
    >
      {complaints.length === 0 ? (
        <div className="empty-state compact">
          <h3>No complaints submitted</h3>
          <p>
            Raise your first complaint.
          </p>
        </div>
      ) : (
        <div className="record-list">

          {complaints.map((complaint) => (
            <div
              key={complaint.id}
              className="request-card"
            >
              <h3>{complaint.subject}</h3>

              <p>{complaint.details}</p>

              <p>
                Status:
                <strong>
                  {" "}
                  {complaint.status}
                </strong>
              </p>
            </div>
          ))}

        </div>
      )}
    </SectionCard>

  </div>
) : null}
      {activeView === "profile" ? (
  <SectionCard
    eyebrow="PROFILE"
    title="Consumer Information"
    description="Details linked to your LPG connection."
  >
    <div className="record-grid">

      <MetricCard
        label="Consumer ID"
        value={consumerData?.consumer_number || "-"}
        tone="blue"
      />

      <MetricCard
        label="Phone"
        value={consumerData?.phone || "-"}
        tone="green"
      />

      <MetricCard
        label="District"
        value={consumerData?.district || "-"}
        tone="orange"
      />

      <MetricCard
        label="Village / City"
        value={consumerData?.["village/city"] || "-"}
        tone="blue"
      />

      <MetricCard
        label="Pincode"
        value={consumerData?.pincode || "-"}
        tone="green"
      />

      <MetricCard
        label="Distributor"
        value={
          consumerData?.assigned_distributor || "-"
        }
        tone="orange"
      />

    </div>
  </SectionCard>
) : null}
    </DashboardLayout>
  );
}

export default ConsumerPortal;