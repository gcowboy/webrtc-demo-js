"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const RegistrationFeePaymentContent: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [adminInfo, setAdminInfo] = useState<{
    adminWallet: { network: string; address: string };
    registrationAmount: number;
    accountType: string;
  } | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Fetch admin info on component mount
  useEffect(() => {
    const fetchAdminInfo = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/registration-fee/admin-info");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load admin information");
        }

        setAdminInfo(data);
      } catch (error: any) {
        toast.error(error.message || "Failed to load payment information");
        console.error("Error fetching admin info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminInfo();
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!transactionId.trim()) {
      newErrors.transactionId = "Transaction hash is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch("/api/registration-fee/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId: transactionId.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Transaction verification failed");
      }

      toast.success(data.message || "Transaction verified successfully! Your account is now active.");
      
      // Redirect to dashboard after successful verification
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Transaction verification failed");
      console.error("Error verifying transaction:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <section className='position-relative'>
        <div className='d-flex tw-h-screen'>
          <div className='flex-grow-1'>
            <div className='max-w-526-px w-100 log-in-card tw-px-6 tw-py-12 mx-auto'>
              <Link href='/' className='tw-mb-17'>
                <Image
                  src='/assets/images/logo/logo.png'
                  alt='img'
                  className='tw-h-13'
                  width={171}
                  height={52}
                />
              </Link>
              <div className='text-center'>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className='text-dark-500 tw-mt-4'>Loading payment information...</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!adminInfo) {
    return (
      <section className='position-relative'>
        <div className='d-flex tw-h-screen'>
          <div className='flex-grow-1'>
            <div className='max-w-526-px w-100 log-in-card tw-px-6 tw-py-12 mx-auto'>
              <Link href='/' className='tw-mb-17'>
                <Image
                  src='/assets/images/logo/logo.png'
                  alt='img'
                  className='tw-h-13'
                  width={171}
                  height={52}
                />
              </Link>
              <div className='text-center'>
                <h4 className='fw-medium text-primary-50 tw-mb-4'>
                  Unable to Load Payment Information
                </h4>
                <p className='text-dark-500 tw-mb-6'>
                  Please try again later or contact support.
                </p>
                <Button onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className='position-relative'>
      <div className='d-flex tw-h-screen'>
        <div className='flex-grow-1'>
          <div className='max-w-526-px w-100 log-in-card tw-px-6 tw-py-12 mx-auto'>
            <Link href='/' className='tw-mb-17'>
              <Image
                src='/assets/images/logo/logo.png'
                alt='img'
                className='tw-h-13'
                width={171}
                height={52}
              />
            </Link>
            <h4 className='fw-medium text-primary-50 tw-mb-4'>
              Registration Fee Payment
            </h4>
            <p className='text-dark-500 tw-mb-8'>
              Please complete your registration by paying the registration fee. Send the required amount to the admin wallet address below and then enter your transaction hash to verify. The system will automatically verify the transaction amount and recipient.
            </p>

            {/* Admin Wallet Info */}
            <div className='tw-mb-8 tw-p-4 bg-light rounded-3 border border-neutral-50'>
              <h5 className='fw-semibold text-dark-600 tw-mb-4'>Payment Details</h5>
              <div className='tw-mb-3'>
                <label className='fw-normal tw-text-sm text-dark-500 d-block tw-mb-2'>
                  Registration Amount ({adminInfo.accountType === 'individual' ? 'Individual' : 'Team'})
                </label>
                <div className='fw-semibold tw-text-lg text-primary-600'>
                  {adminInfo.registrationAmount}
                </div>
              </div>
              {adminInfo.adminWallet.network && (
                <div className='tw-mb-3'>
                  <label className='fw-normal tw-text-sm text-dark-500 d-block tw-mb-2'>
                    Network
                  </label>
                  <div className='fw-normal tw-text-base text-dark-600'>
                    {adminInfo.adminWallet.network.charAt(0).toUpperCase() + adminInfo.adminWallet.network.slice(1)}
                  </div>
                </div>
              )}
              {adminInfo.adminWallet.address && (
                <div>
                  <label className='fw-normal tw-text-sm text-dark-500 d-block tw-mb-2'>
                    Wallet Address
                  </label>
                  <div className='fw-normal tw-text-sm text-dark-600 tw-break-all tw-bg-white tw-p-2 tw-rounded border border-neutral-50'>
                    {adminInfo.adminWallet.address}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(adminInfo.adminWallet.address);
                      toast.success("Wallet address copied to clipboard");
                    }}
                    className='tw-mt-2 tw-text-sm text-primary-600 hover:text-primary-700'
                  >
                    Copy Address
                  </button>
                  <div className='tw-mt-4 tw-pt-4'>
                    <p className='fw-normal tw-text-sm text-dark-600 tw-mb-2'>
                      Once payment is made, please copy the support Telegram contact link and provide your transaction ID below. After confirming your payment, kindly reach out to support.
                    </p>
                    <p className='fw-normal tw-text-sm text-dark-600 tw-mb-3'>
                      Support : <a href="https://t.me/oxbuuny" target="_blank" rel="noopener noreferrer" className="text-primary-600">https://t.me/oxbuuny</a>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("https://t.me/oxbuuny");
                        toast.success("Support link copied to clipboard");
                      }}
                      className='tw-text-sm text-primary-600 hover:text-primary-700'
                    >
                      Copy support address link
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Transaction Verification Form */}
            <form onSubmit={handleSubmit}>
              <div className='tw-mb-6'>
                <Input
                  label="Transaction Hash*"
                  name="transactionId"
                  type="text"
                  placeholder="Enter your transaction hash"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  error={errors.transactionId}
                  required
                />
                <p className='tw-text-sm text-dark-500 tw-mt-2'>
                  Enter the transaction hash from your blockchain transaction. The system will automatically verify the amount and recipient.
                </p>
              </div>
              <Button
                type="submit"
                fullWidth
                isLoading={isVerifying}
                className="tw-mb-3 bg-main-gradient"
              >
                Confirm Payment
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

const Page: React.FC = () => {
  return (
    <Suspense fallback={
      <section className='position-relative'>
        <div className='d-flex tw-h-screen'>
          <div className='flex-grow-1'>
            <div className='max-w-526-px w-100 log-in-card tw-px-6 tw-py-12 mx-auto'>
              <Link href='/' className='tw-mb-17'>
                <Image
                  src='/assets/images/logo/logo.png'
                  alt='img'
                  className='tw-h-13'
                  width={171}
                  height={52}
                />
              </Link>
              <div className='text-center'>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    }>
      <RegistrationFeePaymentContent />
    </Suspense>
  );
};

export default Page;

