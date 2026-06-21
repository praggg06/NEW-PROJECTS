import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import DashboardLayout from "../components/DashboardLayout";
import MetricCard from "../components/MetricCard";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";

function DistributorPortal() {
  const [activeView, setActiveView] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [distributor, setDistributor] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [stockInput, setStockInput] = useState("");
  const distributorId = Number(localStorage.getItem("distributorId"));
  const distributorName = localStorage.getItem("distributorName");

  
console.log(
  "Distributor ID:",
  localStorage.getItem("distributorId")
);

console.log(
  "Distributor Name:",
  localStorage.getItem("distributorName")
);

console.log(
  "Using Distributor Name:",
  distributorName
);
 const navItems = [
  
  {
    id: "pending",
    label: "Orders Queue",
    description: "Awaiting action",
    icon: "01",
  },
   {
    id: "stock",
    label: "Inventory",
    description: "Warehouse stock",
    icon: "02",
  },
  {
    id: "approved",
    label: "Approved",
    description: "Ready for dispatch",
    icon: "03",
  },
  {
    id: "shipped",
    label: "In Transit",
    description: "Orders on route",
    icon: "04",
  },
  {
    id: "completed",
    label: "Delivered",
    description: "Successfully completed",
    icon: "05",
  },
];



  useEffect(() => {
    fetchDashboardData();
  }, []);

async function fetchDashboardData() {
  console.log(
  "Distributor Name Used:",
  distributorName
);
  const distributorResponse =
  await supabase
    .from("distributors")
    .select("*")
   .eq(
  "name",
  distributorName
)
    .single();
    if (distributorResponse.error) {
  console.log(distributorResponse.error);
  return;
}

setDistributor(distributorResponse.data);

const distributorDbName =
  distributorResponse.data.name;
  console.log(
  "Distributor Name From Login:",
 distributorDbName
);
      const requestResponse =
  await supabase
    .from("requests")
    .select("*")
    .eq(
      "assigned_distributor",
     distributorDbName
    )
    .order("id", {
      ascending: false,
    });

    setRequests(
  requestResponse.data || []
);
  

  if (requestResponse.error) {
    console.log(requestResponse.error);
  } else {
    setRequests(requestResponse.data || []);

    console.log(
  "Distributor Login Name:",
  distributorDbName
);

console.log(
  "Requests Found:",
  requestResponse.data
);
  }

  if (distributorResponse.error) {
    console.log(distributorResponse.error);
  } else {
    setDistributor(distributorResponse.data || null);

    console.log(
  "All Requests:",
  requestResponse.data
);

  console.log(
  "Distributor Name:",
  distributorDbName
);

const { data: stockDataRow, error: stockError } =
  await supabase
    .from("distributor_stock")
    .select("*")
    .eq(
      "distributor_name",
      distributorDbName
    )
    .maybeSingle();

console.log("Stock Data:", stockDataRow);
console.log("Stock Error:", stockError);

if (!stockDataRow) {

  console.log(
    "Creating stock row for:",
    distributorDbName
  );

  const {
    data: newStock,
    error: insertError,
  } = await supabase
    .from("distributor_stock")
    .insert([
      {
        distributor_name:
          distributorDbName,
        current_stock: 0,
        reserved_stock: 0,
      },
    ])
    .select()
    .single();

  console.log(
    "Insert Error:",
    insertError
  );

  console.log(
    "New Stock:",
    newStock
  );

  if (!insertError) {
    setStockData(newStock);
  }

} else {

  setStockData(stockDataRow);

}

  }
}
async function addStock() {

  console.log("Add Stock clicked");
  console.log(stockData);
  console.log(stockInput);

  if (!stockInput) return;

  if (!stockData) {
    alert("Stock data not loaded");
    return;
  }

  const { error } = await supabase
    .from("distributor_stock")
    .update({
      current_stock:
        (stockData.current_stock || 0) +
        Number(stockInput),
    })
    .eq(
      "distributor_name",
      stockData.distributor_name
    );

  if (!error) {
    setStockInput("");
    fetchDashboardData();
  }
}

  async function approveRequest(id) {

  if (!stockData) {
    alert("Stock record not found");
    return;
  }

  const availableStock =
  stockData.current_stock -
  stockData.reserved_stock;

if (availableStock <= 0) {
  alert("No stock available to reserve");
  return;
}

  const { error: stockError } = await supabase
    .from("distributor_stock")
    .update({
      reserved_stock: stockData.reserved_stock + 1,
    })
    .eq("distributor_name", stockData.distributor_name);

  if (stockError) {
    console.log(stockError);
    return;
  }

  const { error } = await supabase
    .from("requests")
    .update({ status: "Approved" })
    .eq("id", id);

  if (error) {
    console.log(error);
    return;
  }

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

  if (!stockData) {
    alert("Stock record missing");
    return;
  }

  if (stockData.current_stock <= 0) {
    alert("No stock available");
    return;
  }

  const { error: stockError } = await supabase
    .from("distributor_stock")
    .update({
      current_stock: stockData.current_stock - 1,
      reserved_stock: Math.max(
        stockData.reserved_stock - 1,
        0
      ),
    })
    .eq("distributor_name", stockData.distributor_name);

  if (stockError) {
    console.log(stockError);
    return;
  }

  const { error } = await supabase
    .from("requests")
    .update({ status: "Shipped" })
    .eq("id", id);

  if (error) {
    console.log(error);
    return;
  }

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

  const activeDistributor = distributor || {
    name: distributorName, agency_name: distributorName,
    state: "Not set",
    district: "Not set",
    status: "Active",
    stock: 0,
  };

  return (
    <DashboardLayout
      brand="Distributor Dashboard"
     title="Distributor Operations Center"
subtitle="Manage bookings, inventory, dispatch, and delivery workflow."
      navItems={navItems}
      activeView={activeView}
      onViewChange={setActiveView}
      topbarAction={topbarAction}
      sidebarFooter={sidebarFooter}
    >
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
            description="These requests stay filtered by assigned_distributor so the workflow remains unchanged."
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
                      <p><span>Consumer</span>{request.consumer_name}</p>
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
{activeView === "shipped" ? (
  <SectionCard
    eyebrow="Shipped Orders"
    title="Orders in Transit"
    description="Track orders currently being delivered."
  >
    {shippedRequests.length === 0 ? (
      <div className="empty-state">
        <h3>No orders in transit</h3>
      </div>
    ) : (
      <div className="record-grid">
        {shippedRequests.map((request) => (
          <article key={request.id} className="record-card">
            <div className="record-card-header">
              <div>
                <p className="record-label">
                  Request #{request.id}
                </p>
                <strong>{request.consumer_name}</strong>
              </div>

              <StatusBadge status={request.status} />
            </div>

            <div className="record-details">
              <p>
                <span>District</span>
                {request.district}
              </p>

              <p>
                <span>State</span>
                {request.state}
              </p>
            </div>

            <div className="card-actions">
              <button
                className="primary-button"
                onClick={() =>
                  markAsCompleted(request.id)
                }
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
    title="Delivered Orders"
    description="Successfully completed LPG deliveries."
  >
    {completedRequests.length === 0 ? (
      <div className="empty-state">
        <h3>No completed deliveries</h3>
        <p>Completed orders will appear here.</p>
      </div>
    ) : (
      <div className="record-grid">
        {completedRequests.map((request) => (
          <article key={request.id} className="record-card">
            <div className="record-card-header">
              <div>
                <p className="record-label">
                  Request #{request.id}
                </p>
                <strong>{request.consumer_name}</strong>
              </div>

              <StatusBadge status={request.status} />
            </div>

            <div className="record-details">
              <p>
                <span>District</span>
                {request.district}
              </p>

              <p>
                <span>State</span>
                {request.state}
              </p>

              <p>
                <span>Status</span>
                Delivered
              </p>
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
      <MetricCard
      label="Current Stock"
      value={stockData?.current_stock || 0}
      description="Available inventory"
      tone="blue"
    />

    <MetricCard
      label="Reserved Stock"
      value={stockData?.reserved_stock || 0}
      description="Allocated for approved orders"
      tone="orange"
    />

    <MetricCard
      label="Service Status"
      value={activeDistributor.status || "Active"}
      description="Account state"
      tone="orange"
    />
  </div>

<SectionCard
  eyebrow="INVENTORY ACTION"
  title="Warehouse Controls"
  description="Manage LPG cylinder inventory"
>
  <div className="record-grid">

    <div className="record-card">
      <h3>Available To Allocate</h3>
      <h1>
        {(stockData?.current_stock || 0) -
         (stockData?.reserved_stock || 0)}
      </h1>
      <p>Free cylinders available for new bookings</p>
    </div>

    <div className="record-card">
      <h3>Add Stock</h3>
      <p>Receive cylinders from supplier</p>

      <input
        type="number"
        value={stockInput}
        onChange={(e) => setStockInput(e.target.value)}
        placeholder="Enter quantity"
        className="text-input"
        min="1"
      />

      <div style={{ marginTop: "12px" }}>
        <button
          type="button"
          className="primary-button"
          onClick={addStock}
        >
          Add Inventory
        </button>
      </div>
    </div>

  </div>
</SectionCard>
</div>
) : null}
</DashboardLayout>
  );
}

export default DistributorPortal;