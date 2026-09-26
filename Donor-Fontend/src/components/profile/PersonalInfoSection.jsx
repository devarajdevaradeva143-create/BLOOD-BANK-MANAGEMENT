import { useState } from "react";
import { User, Mail, Phone, Calendar, ArrowLeftRight, MapPin, Building } from "lucide-react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { BLOOD_GROUPS, GENDERS, TN_DISTRICTS } from "../../data/constants";

export default function PersonalInfoSection({ donor, editing, onChange, errors }) {
  const handleChange = (field) => (e) => onChange(field, e.target.value);
  const handleSelectChange = (field) => (e) => onChange(field, e.target.value);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <User className="h-5 w-5 text-brand-600" />
        Personal Information
      </h3>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Full Name"
          id="name"
          value={donor.name}
          onChange={handleChange("name")}
          error={errors.name}
          disabled={!editing}
          required
          placeholder="Enter your full name"
        />
        <Select
          label="Blood Group"
          id="bloodGroup"
          value={donor.bloodGroup}
          onChange={handleSelectChange("bloodGroup")}
          options={BLOOD_GROUPS}
          error={errors.bloodGroup}
          disabled={!editing}
          required
        />
        <Input
          label="Email Address"
          id="email"
          type="email"
          value={donor.email}
          onChange={handleChange("email")}
          error={errors.email}
          disabled={!editing}
          required
          placeholder="you@example.com"
        />
        <Input
          label="Mobile Number"
          id="phone"
          type="tel"
          value={donor.phone}
          onChange={handleChange("phone")}
          error={errors.phone}
          disabled={!editing}
          required
          placeholder="10-digit phone"
          maxLength={10}
        />
        <Input
          label="Date of Birth"
          id="dob"
          type="date"
          value={donor.dob}
          onChange={handleChange("dob")}
          error={errors.dob}
          disabled={!editing}
          required
        />
        <Select
          label="Gender"
          id="gender"
          value={donor.gender}
          onChange={handleSelectChange("gender")}
          options={GENDERS}
          error={errors.gender}
          disabled={!editing}
          required
        />
        <Input
          label="Address"
          id="address"
          value={donor.address}
          onChange={handleChange("address")}
          error={errors.address}
          disabled={!editing}
          required
          placeholder="Enter your address"
        />
        <Select
          label="District"
          id="district"
          value={donor.district}
          onChange={handleSelectChange("district")}
          options={TN_DISTRICTS}
          error={errors.district}
          disabled={!editing}
          required
        />
      </div>
    </div>
  );
}
