'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import type { CountryItem, OrderNumberInput } from '@nuropad/shared-dto';
import { Button } from '@/components/ui/button';
import {
  FormControlField,
  FormControlSelect,
  FormControlInput,
  FormControlButton,
  FormRow,
  FormStack,
} from '@/components/form';
import { fetchNumbersApi } from '@/lib/api';
import { toast } from 'sonner';

export default function PurchaseNumberPage() {
  const { getToken } = useAuth();
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [areaCode, setAreaCode] = useState('');
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [searching, setSearching] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [availableNumbers, setAvailableNumbers] = useState<OrderNumberInput[]>([]);

  const loadCountries = useCallback(async () => {
    if (!getToken) return;
    setLoadingCountries(true);
    try {
      const res = await fetchNumbersApi(getToken, '/numbers/countries');
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      setCountries(Array.isArray(data) ? data : []);
      if (data?.length && !selectedCountry) setSelectedCountry(data[0].code);
    } catch (e) {
      console.error('Failed to load countries', e);
      toast.error('Failed to load countries');
    } finally {
      setLoadingCountries(false);
    }
  }, [getToken, selectedCountry]);

  useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  const handleSearch = async () => {
    console.log("handleSearch called with", { selectedCountry, areaCode });
    if (!getToken || !selectedCountry) {
      toast.error('Please select a country');
      return;
    }
    setSearching(true);
    setAvailableNumbers([]);
    try {
      const params = new URLSearchParams({ countryCode: selectedCountry, areaCode: areaCode.trim() });
      if (areaCode.trim()) params.set('limit', '20');
      const res = await fetchNumbersApi(
        getToken,
        `/numbers/search?${params.toString()}`,
      );
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      setAvailableNumbers(Array.isArray(data) ? data : []);
      if (!data?.length) toast.info('No numbers found for this selection');
    } catch (e) {
      console.error('Search failed', e);
      toast.error('Failed to search numbers');
    } finally {
      setSearching(false);
    }
  };

  const handlePurchase = async (item: OrderNumberInput) => {
    const phoneNumber = item?.phoneNumber;
    if (!getToken || !phoneNumber) return;
    setPurchasing(phoneNumber);
    try {
      const res = await fetchNumbersApi(getToken, '/numbers/order', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber,
          countryCode: selectedCountry,
          monthlyCost: item?.monthlyPrice,
          rawNumberDetails: item,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || res.statusText);
      }
      toast.success(`Purchased ${phoneNumber}`);
      setAvailableNumbers((prev) => prev.filter((n) => n.phoneNumber !== phoneNumber));
    } catch (e) {
      console.error('Purchase failed', e);
      toast.error(e instanceof Error ? e.message : 'Failed to purchase number');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <main className="settings-layout">
      <header className="settings-header">
        <h1>Purchase Phone Number</h1>
        <Link className="panel-link" href="/settings">
          Back to Settings
        </Link>
      </header>

      <section className="settings-card">
        <h2>Select country and search</h2>

        <FormStack className="purchase-form">
          <FormRow>
            <FormControlField label="Country" htmlFor="country">
              <FormControlSelect
                id="country"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                disabled={loadingCountries}
                aria-label="Select country"
                placeholder={loadingCountries ? 'Loading…' : 'Select country'}
                options={countries.map((c) => ({
                  value: c.code,
                  label: `${c.name} (${c.code})`,
                }))}
              />
            </FormControlField>

            <FormControlField
              label="Area code / prefix (optional)"
              htmlFor="area"
            >
              <FormControlInput
                id="area"
                placeholder="e.g. 415"
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value)}
                maxLength={10}
                aria-label="Area code or prefix"
              />
            </FormControlField>
          </FormRow>

          <FormControlButton
            type="button"
            onClick={handleSearch}
            disabled={searching || !selectedCountry}
          >
            {searching ? 'Searching…' : 'Search available numbers'}
          </FormControlButton>
        </FormStack>

        {availableNumbers.length > 0 && (
          <div className="numbers-list">
            <header className="numbers-list__header">
              <h3 className="numbers-list__title">Available numbers</h3>
              <span className="numbers-list__count" aria-label={`${availableNumbers.length} numbers`}>
                {availableNumbers.length}
              </span>
            </header>
            <ul className="numbers-list__grid">
              {availableNumbers.map((item) => {
                const num = item?.phoneNumber ?? '';
                const cost = item?.monthlyPrice;
                const isPurchasing = purchasing === num;
                return (
                  <li key={num}>
                    <article className="number-card">
                      <div className="number-card__accent" aria-hidden />
                      <div className="number-card__body">
                        <div className="number-card__main">
                          <p className="number-card__number">{num || '—'}</p>
                          <dl className="number-card__meta">
                            {cost != null && (
                              <>
                                <dt className="number-card__meta-dt">Monthly</dt>
                                <dd className="number-card__meta-dd">
                                  USD {cost}/mo
                                </dd>
                              </>
                            )}
                          </dl>
                        </div>
                        <div className="number-card__action">
                          <Button
                            variant="default"
                            size="sm"
                            className="number-card__purchase-btn"
                            onClick={() => handlePurchase(item)}
                            disabled={isPurchasing}
                          >
                            {isPurchasing ? 'Purchasing…' : 'Purchase'}
                          </Button>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
