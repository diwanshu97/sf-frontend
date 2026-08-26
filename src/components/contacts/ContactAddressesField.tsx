"use client";

import { useRef, useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { MAX_ADDRESSES } from "@/lib/contacts/schema";
import {
  ADDRESS_TYPES,
  type AddressFormValues,
  type AddressInput,
} from "@/lib/contacts/types";

const INPUT =
  "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary";

const EMPTY_ADDRESS: AddressFormValues = {
  type: "Home",
  street: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
};

type AddressDraft = AddressFormValues & { key: string };

function toDraft(address: Partial<AddressInput>, key: string): AddressDraft {
  return {
    type: address.type ?? "Home",
    street: address.street ?? "",
    city: address.city ?? "",
    state: address.state ?? "",
    postal_code: address.postal_code ?? "",
    country: address.country ?? "",
    key,
  };
}

function AddressControl({
  index,
  field,
  label,
  value,
  maxLength,
  placeholder,
  error,
}: {
  index: number;
  field: Exclude<keyof AddressInput, "type">;
  label: string;
  value: string;
  maxLength: number;
  placeholder: string;
  error?: string;
}) {
  const id = `address-${index}-${field}`;
  const errorId = `${id}-error`;
  return (
    <div className={field === "street" ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        name={`addresses.${index}.${field}`}
        defaultValue={value}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${INPUT} ${error ? "border-destructive" : ""}`}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-[13px] text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function ContactAddressesField({
  initialAddresses,
  fieldErrors,
}: {
  initialAddresses: Partial<AddressInput>[];
  fieldErrors?: Record<string, string>;
}) {
  const nextKey = useRef(initialAddresses.length);
  const [addresses, setAddresses] = useState<AddressDraft[]>(() =>
    initialAddresses.map((address, index) => toDraft(address, `initial-${index}`)),
  );

  function addAddress() {
    if (addresses.length >= MAX_ADDRESSES) return;
    const key = `added-${nextKey.current}`;
    nextKey.current += 1;
    setAddresses((current) => [...current, { ...EMPTY_ADDRESS, key }]);
  }

  function removeAddress(key: string) {
    setAddresses((current) => current.filter((address) => address.key !== key));
  }

  return (
    <fieldset className="space-y-4">
      <legend className="sr-only">Addresses</legend>
      <input type="hidden" name="address_count" value={addresses.length} />

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-hairline pb-2">
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground">Addresses</h2>
          <p className="text-[13px] text-muted-foreground">
            Add up to {MAX_ADDRESSES} Home, Work, or Other addresses.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addAddress}
          disabled={addresses.length >= MAX_ADDRESSES}
        >
          <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Add address
        </Button>
      </div>

      {fieldErrors?.addresses ? (
        <p role="alert" className="text-[13px] text-destructive">
          {fieldErrors.addresses}
        </p>
      ) : null}

      {addresses.length === 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          No addresses added.
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address, index) => {
            const prefix = `addresses.${index}`;
            return (
              <div key={address.key} className="rounded-lg border border-border bg-card/50 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <label
                      htmlFor={`address-${index}-type`}
                      className="mb-1.5 block text-[13px] font-medium text-foreground"
                    >
                      Address type
                    </label>
                    <select
                      id={`address-${index}-type`}
                      name={`addresses.${index}.type`}
                      defaultValue={address.type}
                      className={`${INPUT} min-w-32`}
                    >
                      {ADDRESS_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAddress(address.key)}
                    aria-label={`Remove address ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                    Remove
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <AddressControl
                    index={index}
                    field="street"
                    label="Street address"
                    value={address.street}
                    maxLength={300}
                    placeholder="1 Market St, Suite 400"
                    error={fieldErrors?.[`${prefix}.street`] ?? fieldErrors?.[prefix]}
                  />
                  <AddressControl
                    index={index}
                    field="city"
                    label="City"
                    value={address.city}
                    maxLength={120}
                    placeholder="San Francisco"
                    error={fieldErrors?.[`${prefix}.city`]}
                  />
                  <AddressControl
                    index={index}
                    field="state"
                    label="State / region"
                    value={address.state}
                    maxLength={120}
                    placeholder="CA"
                    error={fieldErrors?.[`${prefix}.state`]}
                  />
                  <AddressControl
                    index={index}
                    field="postal_code"
                    label="Postal code"
                    value={address.postal_code}
                    maxLength={20}
                    placeholder="94105"
                    error={fieldErrors?.[`${prefix}.postal_code`]}
                  />
                  <AddressControl
                    index={index}
                    field="country"
                    label="Country"
                    value={address.country}
                    maxLength={120}
                    placeholder="USA"
                    error={fieldErrors?.[`${prefix}.country`]}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
