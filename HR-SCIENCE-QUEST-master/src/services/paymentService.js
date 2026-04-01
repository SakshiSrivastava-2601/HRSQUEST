import { studentApiRequest } from "./api";

export const createRazorpayOrder = (courseId) =>
  studentApiRequest(`/payments/razorpay/order?course_id=${Number(courseId)}`, {
    method: "POST",
  });

export const verifyRazorpayPayment = ({
  course_id,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) =>
  studentApiRequest(
    `/payments/razorpay/verify?course_id=${Number(course_id)}&razorpay_order_id=${encodeURIComponent(
      razorpay_order_id
    )}&razorpay_payment_id=${encodeURIComponent(
      razorpay_payment_id
    )}&razorpay_signature=${encodeURIComponent(razorpay_signature)}`,
    { method: "POST" }
  );

export const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
