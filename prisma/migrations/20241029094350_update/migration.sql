-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "ArtExpoSchema";

-- CreateTable
CREATE TABLE "ArtExpoSchema"."Users" (
    "user_id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "points" INTEGER NOT NULL DEFAULT 0,
    "role" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "ArtExpoSchema"."Events" (
    "event_id" SERIAL NOT NULL,
    "event_name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "event_type" TEXT NOT NULL,
    "ticket_available" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "discounted_price" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "Events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "ArtExpoSchema"."ReferralCodes" (
    "referral_id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "referral_code" TEXT,
    "referral_points" INTEGER NOT NULL DEFAULT 50,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "count_used" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReferralCodes_pkey" PRIMARY KEY ("referral_id")
);

-- CreateTable
CREATE TABLE "ArtExpoSchema"."Bookings" (
    "booking_id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "booking_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Bookings_pkey" PRIMARY KEY ("booking_id")
);

-- CreateTable
CREATE TABLE "ArtExpoSchema"."ReferralDiscounts" (
    "discount_id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "discount_amount" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralDiscounts_pkey" PRIMARY KEY ("discount_id")
);

-- CreateTable
CREATE TABLE "ArtExpoSchema"."Payments" (
    "payment_id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_status" TEXT NOT NULL,

    CONSTRAINT "Payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "ArtExpoSchema"."Reviews" (
    "review_id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "review" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" INTEGER NOT NULL,

    CONSTRAINT "Reviews_pkey" PRIMARY KEY ("review_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "ArtExpoSchema"."Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCodes_referral_code_key" ON "ArtExpoSchema"."ReferralCodes"("referral_code");

-- AddForeignKey
ALTER TABLE "ArtExpoSchema"."ReferralCodes" ADD CONSTRAINT "ReferralCodes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ArtExpoSchema"."Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtExpoSchema"."Bookings" ADD CONSTRAINT "Bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ArtExpoSchema"."Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtExpoSchema"."Bookings" ADD CONSTRAINT "Bookings_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ArtExpoSchema"."Events"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtExpoSchema"."ReferralDiscounts" ADD CONSTRAINT "ReferralDiscounts_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ArtExpoSchema"."Events"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtExpoSchema"."Payments" ADD CONSTRAINT "Payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ArtExpoSchema"."Bookings"("booking_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtExpoSchema"."Reviews" ADD CONSTRAINT "Reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ArtExpoSchema"."Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtExpoSchema"."Reviews" ADD CONSTRAINT "Reviews_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ArtExpoSchema"."Events"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtExpoSchema"."Reviews" ADD CONSTRAINT "Reviews_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "ArtExpoSchema"."Payments"("payment_id") ON DELETE RESTRICT ON UPDATE CASCADE;
