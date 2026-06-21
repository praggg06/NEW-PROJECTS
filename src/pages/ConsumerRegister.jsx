import { useState } from "react";
import { supabase } from "../lib/supabase";



function ConsumerRegister({setPage}) {
  const [consumerName, setConsumerName] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("");
const [district, setDistrict] = useState("");
const [pincode, setPincode] = useState("");

const [villageCity, setVillageCity] = useState("");
const [assignedDistributor, setAssignedDistributor] = useState("");

const [password, setPassword] = useState("");
  const [step, setStep] = useState(1);
  const [generatedConsumerNumber, setGeneratedConsumerNumber] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
 async function createAccount(e) {
  e.preventDefault();
  if (
  !consumerName ||
  !phone ||
  !state ||
  !district ||
  !pincode ||
  !villageCity
) {
  alert("Please fill all fields");
  return;
}
  if (!/^\d{10}$/.test(phone)) {
    alert("Phone number must be exactly 10 digits");
    return;
  }

  const { data: existingUser } = await supabase
    .from("consumers")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existingUser) {
    alert("An account already exists with this phone number");
    return;
  }

  const consumerNumber =
  "LPG" + Date.now().toString().slice(-6);

setGeneratedConsumerNumber(consumerNumber);

const { data: distributor } = await supabase
  .from("distributors")
  .select("name")
  .ilike("district", district)
  .single();

setAssignedDistributor(
  distributor?.name || "Not Assigned"
);


setStep(2);
 }
  async function completeRegistration() {
  if (!password) {
    alert("Please create a password");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

 const { error } = await supabase
  .from("consumers")
  .insert([
    {
      consumer_name: consumerName,
      consumer_number: generatedConsumerNumber,
      phone: phone,
      state: state,
      district: district,
      pincode: pincode,
      "village/city": villageCity,
      assigned_distributor: assignedDistributor,
      password: password,
    },
  ]);

  if (error) {
  console.log("FULL ERROR:", error);

  alert(
    `Error: ${error.message}\n\nDetails: ${error.details || "No details"}`
  );

  return;
}

  alert(
    `Registration Successful!\n\nConsumer ID: ${generatedConsumerNumber}`
  );

  window.location.reload();
}

 return (
  <div style={{ padding: "30px" }}>

    <button
      type="button"
      onClick={() => setPage("home")}
      style={{
        marginBottom: "20px",
        padding: "10px 20px",
        borderRadius: "999px",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "#0C1D35",
        color: "white",
        cursor: "pointer",
        fontWeight: "600",
      }}
    >
      ← Home
    </button>

    <h1>Consumer Registration</h1>

      {step === 1 ? (
  <form onSubmit={createAccount}>
        <input
          type="text"
          placeholder="Consumer Name"
          value={consumerName}
          onChange={(e) =>
            setConsumerName(e.target.value)
          }
        />

        <br /><br />

        <input
  type="tel"
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
  placeholder="Enter 10 digit mobile number"
  className="text-input"
/>

        <br /><br />

        <input
          type="text"
          placeholder="State"
          value={state}
          onChange={(e) =>
            setState(e.target.value)
          }
        />

        <br /><br />

        <input
          type="text"
          placeholder="District"
          value={district}
          onChange={(e) =>
            setDistrict(e.target.value)
          }
        />

        <br /><br />

        <input
          type="text"
          placeholder="Pincode"
          value={pincode}
          onChange={(e) =>
            setPincode(e.target.value)
          }
        />

       <br /><br />

<input
  type="text"
  placeholder="Village / City"
  value={villageCity}
  onChange={(e) =>
    setVillageCity(e.target.value)
  }
/>

<br /><br />

<button type="submit">
          Create Account
        </button>
      </form>
) : (
  <div>

    <h2>Connection Created Successfully</h2>

    <p>Your Consumer ID</p>

    <h1>{generatedConsumerNumber}</h1>
    <p>
  Assigned Distributor:
  <strong> {assignedDistributor}</strong>
</p>

    <br />

    <input
      type="password"
      placeholder="Create Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />

    <br /><br />

    <input
      type="password"
      placeholder="Confirm Password"
      value={confirmPassword}
      onChange={(e) =>
        setConfirmPassword(e.target.value)
      }
    />

    <br /><br />

    <button
      type="button"
      onClick={completeRegistration}
    >
      Complete Registration
    </button>

  </div>
)}
    </div>
  );
}

export default ConsumerRegister;