import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import DashboardLayout from "../components/DashboardLayout";
import MetricCard from "../components/MetricCard";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";

function DistributorPortal() {
  const rawDistributorId = localStorage.getItem("distributorId");
  const distributorId = rawDistributorId ? Number(rawDistributorId) : 1;
  const distributorName = localStorage.getItem("distributorName") || "Mumbai LPG Distribution";
  const effectiveDistributorId = Number.isInteger(distributorId) && distributorId > 0 ? distributorId : 1;

  const sampleDistributor = {
    id: effectiveDistributorId,
    name: distributorName,
    agency_name: distributorName,
    state: "Maharashtra",
    district: "Mumbai",
    status: "Active",
    stock: 320,
  };

  const sampleStockData = {
    distributor_name: sampleDistributor.name,
    current_stock: sampleDistributor.stock,
    reserved_stock: 100,
  };

  const sampleRequests = [
  {
      id: 101,
      consumer_name: "Raj Kumar",
      state: "Maharashtra",
      district: "Mumbai",
      distributor_id: effectiveDistributorId,
      pincode: "400001",
      status: "Pending",
    },
    {
      id: 102,
      consumer_name: "Priya Singh",
      state: "Delhi",
      district: "South Delhi",
      distributor_id: effectiveDistributorId,
      pincode: "110016",
      status: "Approved",
    },
    {
      id: 103,
      consumer_name: "Amit Patel",
      state: "Gujarat",
      district: "Ahmedabad",
      distributor_id: effectiveDistributorId,
      pincode: "380001",
      status: "Shipped",
    },
    {
      id: 104,
      consumer_name: "Anjali Mehta",
      state: "Maharashtra",
      district: "Mumbai",
      distributor_id: effectiveDistributorId,
      pincode: "400001",
      status: "Completed",
    },
  ];

  const [activeView, setActiveView] = useState("pending");
  const [requests, setRequests] = useState(sampleRequests);
  const [distributor, setDistributor] = useState(sampleDistributor);
  const [stockInput, setStockInput] = useState("");
  const [stockData, setStockData] = useState(sampleStockData);

 const navItems = [
  {
    id: "pending",
    label: "Pending Requests",
    description: "Requests waiting for action",
    icon: "01",
  },
  {
    id: "approved",
    label: "Approved Requests",
    description: "Ready for dispatch",
    icon: "02",
  },
  {
    id: "shipped",
    label: "Shipped Orders",
    description: "Orders in transit",
    icon: "03",
  },
  {
    id: "completed",
    label: "Completed Orders",
    description: "Successfully delivered",
    icon: "04",
  },
  {
    id: "stock",
    label: "Stock Overview",
    description: "Inventory at a glance",
    icon: "05",
  },
  {
    id: "profile",
    label: "Profile Page",
    description: "Agency details",
    icon: "06",
  },
];



  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    const [requestResponse, distributorResponse, stockResponse] = await Promise.all([
      supabase
        .from("requests")
        .select("*")
        .eq("distributor_id", distributorId)
        .order("id", { ascending: false }),
      supabase
        .from("distributors")
        .select("*")
        .eq("id", distributorId)
        .single(),
      supabase
        .from("distributor_stock")
        .select("*")
        .eq("distributor_name", distributorName)
        .single(),
    ]);

    if (requestResponse.error) {
      console.log(requestResponse.error);
    } else {
      setRequests(requestResponse.data || []);
    }

    const requestData =
      requestResponse.error || !requestResponse.data?.length
        ? sampleRequests
        : requestResponse.data;
    const distributorData =
      distributorResponse.error || !distributorResponse.data
        ? sampleDistributor
        : distributorResponse.data;
    const stockDataRow =
      stockResponse.error || !stockResponse.data
        ? sampleStockData
        : stockResponse.data;

    if (requestResponse.error) {
      console.log(requestResponse.error);
    }

    setRequests(requestData);
    setDistributor(distributorData);
    setStockData(stockDataRow);
  }

  async function approveRequest(id) {
    const { error } = await supabase
      .from("requests")
      .update({ status: "Approved" })
      .eq("id", id);

    if (error) {
      console.log(error);
      alert("Approval Failed");
      return;
    }

    alert("Request Approved");
    fetchDashboardData();
  }

 async function rejectRequest(id) {
  const { error } = await supabase
    .from("requests")
    .update({ status: "Rejected" })
    .eq("id", id);

  if (error) {
    console.log(error);
    alert("Rejection Failed");
    return;
  }

  alert("Request Rejected");
  fetchDashboardData();
}

async function markAsShipped(id) {
  const { error } = await supabase
    .from("requests")
    .update({ status: "Shipped" })
    .eq("id", id);

  if (error) {
    console.log(error);
    alert("Failed to update shipment status");
    return;
  }

  alert("Order marked as Shipped");
  fetchDashboardData();
}

async function markAsCompleted(id) {
  const { error } = await supabase
    .from("requests")
    .update({ status: "Completed" })
    .eq("id", id);

  if (error) {
    console.log(error);
    alert("Failed to complete order");
    return;
  }

  alert("Order marked as Completed");
  fetchDashboardData();
}

async function addStock() {
  if (!stockInput || !stockData) return;

  const distributorNameKey = stockData.distributor_name || activeDistributor.name || "";
  const { error } = await supabase
    .from("distributor_stock")
    .update({
      current_stock: (stockData?.current_stock || 0) + Number(stockInput),
    })
    .eq("distributor_name", distributorNameKey);

  if (!error) {
    // NEW: log this addition so Government can audit received vs delivered
    await supabase.from("stock_updates").insert([
      {
        distributor_name: stockData.distributor_name,
        district: distributor?.district || null,
        cylinder_type: "Standard",
        quantity: Number(stockInput),
        action: "Added",
      },
    ]);

    setStockInput("");
    fetchDashboardData();
  }
}


  function handleLogout() {
    localStorage.removeItem("distributorId");
    localStorage.removeItem("distributorName");
    window.location.reload();
  }

  const pendingRequests = requests.filter((request) => request.status === "Pending");
  const approvedRequests = requests.filter((request) => request.status === "Approved");
  const rejectedRequests = requests.filter((request) => request.status === "Rejected");
  const shippedRequests = requests.filter((request) => request.status === "Shipped");
  const completedRequests = requests.filter((request) => request.status === "Completed");

  const topbarAction = (
    <button type="button" className="secondary-button" onClick={handleLogout}>
      Logout
    </button>
  );

  const sidebarFooter = (
    <button type="button" className="ghost-button sidebar-footer-button" onClick={handleLogout}>
      Sign out
    </button>
  );

  const activeDistributor = distributor || sampleDistributor;

  return (
    <DashboardLayout
      brand="Distributor Dashboard"
      title={`Welcome, ${activeDistributor.name ||activeDistributor.agency_name || "Distributor"}`}
      subtitle="Monitor assigned refill requests, decide status updates, and keep dispatch operations in view."
      navItems={navItems}
      activeView={activeView}
      onViewChange={setActiveView}
      topbarAction={topbarAction}
      sidebarFooter={sidebarFooter}
    >
      <div className="distributor-hero-panel">
        <div>
          <p className="eyebrow">Operations Hub</p>
          <h2>National Freight Tracking System</h2>
          <p className="distributor-hero-text">
            View inventory, live shipments, and alert-driven delivery actions within the distributor command center.
          </p>
        </div>
        <div className="distributor-hero-kpis">
          <div>
            <strong>{approvedRequests.length + pendingRequests.length + shippedRequests.length + completedRequests.length}</strong>
            <span>Total Active Orders</span>
          </div>
          <div>
            <strong>{stockData?.current_stock ?? activeDistributor.stock ?? 0} MT</strong>
            <span>Current Stock</span>
          </div>
          <div>
            <strong>{shippedRequests.length}</strong>
            <span>In Transit</span>
          </div>
        </div>
      </div>
      {activeView === "pending" ? (
        <div className="dashboard-grid dashboard-grid-wide">
          <div className="metric-grid">
            <MetricCard label="Pending" value={pendingRequests.length} description="Awaiting approval or rejection" tone="orange" />
            <MetricCard label="Approved" value={approvedRequests.length} description="Ready for shipment" tone="green" />
           <MetricCard
  label="Shipped"
  value={shippedRequests.length}
  description="Orders currently in transit"
  tone="blue"
/>
          </div>

          <SectionCard
            eyebrow="Pending Requests"
            title="Action queue"
            description="These requests stay filtered by distributor_id so the workflow remains unchanged."
          >
            {pendingRequests.length === 0 ? (
              <div className="empty-state">
                <h3>No pending requests</h3>
                <p>New consumer bookings will appear here as soon as they are assigned to this distributor.</p>
              </div>
            ) : (
              <div className="record-grid">
                {pendingRequests.map((request) => (
                  <article key={request.id} className="record-card">
                    <div className="record-card-header">
                      <div>
                        <p className="record-label">Request #{request.id}</p>
                        <strong>{request.consumer_name}</strong>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>

                    <div className="record-details">
                      <p><span>District</span>{request.district || "-"}</p>
                      <p><span>State</span>{request.state || "-"}</p>
                      <p><span>Pincode</span>{request.pincode || "-"}</p>
                      <p><span>Distributor</span>{request.distributor_id || "-"}</p>
                    </div>

                    <div className="card-actions">
                      <button type="button" className="primary-button" onClick={() => approveRequest(request.id)}>
                        Approve
                      </button>
                      <button type="button" className="secondary-button" onClick={() => rejectRequest(request.id)}>
                        Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      ) : null}

      {activeView === "approved" ? (
        <SectionCard
          eyebrow="Approved Requests"
          title="Completed approvals"
          description="Approved bookings are shown separately so the operations team can verify completed decisions."
        >
          {approvedRequests.length === 0 ? (
            <div className="empty-state">
              <h3>No approved requests</h3>
              <p>Approve a pending request to populate this queue.</p>
            </div>
          ) : (
            <div className="record-grid">
              {approvedRequests.map((request) => (
                <article key={request.id} className="record-card">
                  <div className="record-card-header">
                    <div>
                      <p className="record-label">Request #{request.id}</p>
                      <strong>{request.consumer_name}</strong>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  <div className="record-details">
                    <p><span>District</span>{request.district || "-"}</p>
                    <p><span>State</span>{request.state || "-"}</p>
                    <p><span>Pincode</span>{request.pincode || "-"}</p>
                    <p><span>Dispatched</span>Ready for delivery</p>
                  </div>
                  <div className="card-actions">
  <button
    type="button"
    className="primary-button"
    onClick={() => markAsShipped(request.id)}
  >
    Mark Shipped
  </button>
</div>
                </article>
              ))}
            </div>
          )}
        </SectionCard>
      ) : null}

     

      {activeView === "stock" ? (
        <div className="dashboard-grid">
          <div className="metric-grid">
            <MetricCard label="Current Stock" value={stockData?.current_stock ?? activeDistributor.stock ?? 0} description="Fetched from the distributor inventory record" tone="blue" />
            <MetricCard label="Assigned District" value={activeDistributor.district || "Not set"} description="Operational region" tone="green" />
            <MetricCard label="Service Status" value={activeDistributor.status || "Active"} description="Account state in Supabase" tone="orange" />
          </div>

          <SectionCard
            eyebrow="Stock Overview"
            title="Inventory context"
            description="This panel keeps the existing schema unchanged while giving the distributor a high-level operational view."
          >
            <div className="timeline">
              <div className="timeline-item">
                <span className="timeline-step">01</span>
                <div>
                  <strong>Assigned cylinders</strong>
                  <p>{stockData?.current_stock ?? activeDistributor.stock ?? 0} cylinders remain available for the current service area.</p>
                </div>
              </div>
              <div className="timeline-item">
                <span className="timeline-step">02</span>
                <div>
                  <strong>Request pressure</strong>
                  <p>{pendingRequests.length} bookings are still waiting in the action queue.</p>
                </div>
              </div>
              <div className="timeline-item">
                <span className="timeline-step">03</span>
                <div>
                  <strong>Delivery readiness</strong>
                  <p>{approvedRequests.length} approved bookings can move to dispatch planning.</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {activeView === "shipped" ? (
  <SectionCard
    eyebrow="Shipped Orders"
    title="Orders in transit"
    description="Track all orders that have been shipped and are awaiting delivery."
  >
    {shippedRequests.length === 0 ? (
      <div className="empty-state">
        <h3>No shipped orders</h3>
        <p>Mark an approved order as shipped to see it here.</p>
      </div>
    ) : (
      <div className="record-grid">
        {shippedRequests.map((request) => (
          <article key={request.id} className="record-card">
            <div className="record-card-header">
              <div>
                <p className="record-label">Request #{request.id}</p>
                <strong>{request.consumer_name}</strong>
              </div>
              <StatusBadge status={request.status} />
            </div>

            <div className="record-details">
              <p><span>District</span>{request.district || "-"}</p>
              <p><span>State</span>{request.state || "-"}</p>
              <p><span>Pincode</span>{request.pincode || "-"}</p>
            </div>

            <div className="card-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => markAsCompleted(request.id)}
              >
                Mark Completed
              </button>
            </div>
          </article>
        ))}
      </div>
    )}
  </SectionCard>
) : null}

{activeView === "completed" ? (
  <SectionCard
    eyebrow="Completed Orders"
    title="Delivered orders"
    description="Successfully completed LPG deliveries."
  >
    {completedRequests.length === 0 ? (
      <div className="empty-state">
        <h3>No completed orders</h3>
        <p>Completed deliveries will appear here.</p>
      </div>
    ) : (
      <div className="record-grid">
        {completedRequests.map((request) => (
          <article key={request.id} className="record-card">
            <div className="record-card-header">
              <div>
                <p className="record-label">Request #{request.id}</p>
                <strong>{request.consumer_name}</strong>
              </div>
              <StatusBadge status={request.status} />
            </div>

            <div className="record-details">
              <p><span>District</span>{request.district || "-"}</p>
              <p><span>State</span>{request.state || "-"}</p>
              <p><span>Pincode</span>{request.pincode || "-"}</p>
            </div>
          </article>
        ))}
      </div>
    )}
  </SectionCard>
) : null}

      {activeView === "profile" ? (
        <div className="dashboard-grid">
          <SectionCard
            eyebrow="Profile Page"
            title="Distributor account snapshot"
            description="The login identity is reused without changing the distributor table structure."
          >
            <div className="profile-summary vertical">
              <p><strong>Agency:</strong> {activeDistributor.name || activeDistributor.agency_name ||"Not set"}</p>
              <p><strong>State:</strong> {activeDistributor.state || "Not set"}</p>
              <p><strong>District:</strong> {activeDistributor.district || "Not set"}</p>
              <p><strong>Username:</strong> {distributor?.username || "Not set"}</p>
              <p><strong>Status:</strong> {activeDistributor.status || "Active"}</p>
              <p><strong>Stock:</strong> {activeDistributor.stock || 0}</p>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Operational Summary"
            title="Workflow health"
            description="A concise summary of request movement through the existing approval flow."
            compact
          >
            <div className="metric-grid">
              <MetricCard label="Total requests" value={requests.length} description="Assigned to this distributor" tone="blue" />
              <MetricCard label="Pending review" value={pendingRequests.length} description="Still waiting for action" tone="orange" />
             <MetricCard
  label="Completed"
  value={completedRequests.length}
  description="Successfully delivered"
  tone="green"
/>
            </div>
          </SectionCard>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

export default DistributorPortal;
