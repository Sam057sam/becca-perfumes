"use client";

import { Button } from "@/components/ui/button";

export function FetchLocationButton() {
  async function onClick() {
    const pinEl = document.getElementById("pincode") as HTMLInputElement | null;
    const cityEl = document.getElementById("city") as HTMLInputElement | null;
    const stateEl = document.getElementById("state") as HTMLInputElement | null;
    const countryEl = document.getElementById("country") as HTMLInputElement | null;
    const pin = pinEl?.value.trim();
    if (!pin) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(pin)}`);
      const data = await res.json();
      const first = Array.isArray(data) && data[0];
      const office = first?.PostOffice && first.PostOffice[0];
      if (office) {
        if (cityEl) cityEl.value = office.District || cityEl.value;
        if (stateEl) stateEl.value = office.State || stateEl.value;
        if (countryEl) countryEl.value = office.Country || countryEl.value || "India";
      }
    } catch {}
  }
  return (
    <Button type="button" variant="outline" onClick={onClick}>
      Fetch
    </Button>
  );
}

