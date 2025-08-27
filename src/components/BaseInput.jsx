// src/components/BaseInput.jsx
import React from "react";
import "./BaseStyles.css";

const BaseInput = ({ label, type = "text", value, onChange, required }) => {
  return (
    <div className="input-group mb-3">
      <input
        className="input"
        type={type}
        value={value}
        onChange={onChange}
        required={required}
      />
      <label className="user-label">{label}</label>
    </div>
  );
};

export default BaseInput;
