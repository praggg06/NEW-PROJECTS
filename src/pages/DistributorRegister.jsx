import { useState } from "react";
import { supabase } from "../lib/supabase";

function DistributorRegister({ onBackToHome }) {
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function createAccount(e) {
    e.preventDefault();

    const { error } = await supabase
      .from("distributors")
      .insert([
        {
          name,
          state,
          district,
          username,
          password,
        },
      ]);

      await supabase
  .from("distributor_stock")
  .insert([
    {
      distributor_name: name,
      current_stock: 0,
      reserved_stock: 0,
    },
  ]);

    if (error) {
      console.log(error);
      alert("Account Creation Failed");
    } else {
      alert("Distributor Account Created");

      setName("");
      setState("");
      setDistrict("");
      setUsername("");
      setPassword("");
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-panel">
        <p className="eyebrow">Distributor Onboarding</p>
        <h1 className="auth-title">Create a distributor account</h1>
        <p className="auth-copy">This keeps the same schema fields already used by the app while making the onboarding form easier to use.</p>

        <form className="auth-form" onSubmit={createAccount}>
          <label className="field">
            <span>Agency Name</span>
            <input
              placeholder="Agency Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-input"
            />
          </label>

          <div className="form-grid two-col">
            <label className="field">
              <span>State</span>
              <input
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="text-input"
              />
            </label>

            <label className="field">
              <span>District</span>
              <input
                placeholder="District"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="text-input"
              />
            </label>
          </div>

          <div className="form-grid two-col">
            <label className="field">
              <span>Username</span>
              <input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-input"
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-input"
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              Create Account
            </button>
            <button type="button" className="ghost-button" onClick={onBackToHome}>
              Back to Home
            </button>
          </div>
        </form>
      </section>

      <aside className="auth-aside">
        <h2>Simple registration</h2>
        <p>The account details are saved into the existing distributors table, so the login and portal flow keeps working exactly as before.</p>
      </aside>
    </div>
  );
}

export default DistributorRegister;