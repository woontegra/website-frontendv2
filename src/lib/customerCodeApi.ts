import { apiRequest, type ApiError } from '@/lib/apiClient';

export type RenewalQuote = {
  periodLabel: string;
  normalPriceKurus: number;
  campaignApplied: boolean;
  campaignDiscountRate: number;
  campaignDiscountAmountKurus: number;
  finalPriceKurus: number;
  campaignEndsAt: string | null;
  currency: 'TRY';
  normalPriceMessage: string | null;
};

export type CustomerCodeSummary = {
  accountEmail: string | null;
  maskedName: string;
  maskedEmail: string;
  currentPackage: string | null;
  subscriptionEndsAt: string | null;
  barAssociationName: string | null;
  checkoutToken: string;
  checkoutExpiresAt: string;
  selectedProductType: 'monthly' | 'annual';
  selectedSubscriptionPeriod: number;
  hasCompleteBillingInfo: boolean;
  billingInfo: StoredRenewalBillingInfo | null;
  renewalQuote: RenewalQuote;
};

export type RenewalBillingInfo = {
  invoiceType: 'individual' | 'corporate';
  fullName: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  district: string;
  openAddress: string;
  address: string;
  identityNumber?: string;
  companyName?: string;
  taxNumber?: string;
  taxOffice?: string;
};

export type StoredRenewalBillingInfo = Omit<RenewalBillingInfo, 'email'>;

export type RenewalPayment = {
  token: string;
  merchantOid: string;
  chargedAmountKurus: number;
  currency: 'TRY';
  renewalQuote: RenewalQuote;
  testMode: boolean;
};

export type BankTransferAvailability = {
  isActive: boolean;
};

export type BankTransferDetails = {
  bankName: string;
  accountHolderName: string;
  iban: string;
  branchInfo: string;
  instructions: string;
  reference: string;
};

export type RenewalBankTransferOrder = {
  merchantOid: string;
  paymentMethod: 'BANK_TRANSFER';
  status: 'bank_transfer_pending';
  amount: number;
  amountFormatted: string;
  renewalQuote: RenewalQuote;
  bankTransfer: BankTransferDetails;
};

export type RenewalPaymentState =
  | 'PAYMENT_PENDING'
  | 'PAYMENT_FAILED'
  | 'FULFILLMENT_PENDING'
  | 'FULFILLMENT_FAILED'
  | 'COMPLETED';

export type RenewalPaymentStatus = {
  state: RenewalPaymentState;
  chargedAmountKurus: number;
  currency: 'TRY';
  newSubscriptionEndsAt: string | null;
};

export type CustomerCodeValidationSuccessResponse = {
  success: true;
  data: CustomerCodeSummary & {
    valid: true;
  };
};

export type CustomerCodeValidationFailureResponse = {
  success: false;
  code: 'INVALID_CUSTOMER_CODE' | 'SERVICE_UNAVAILABLE';
  message: string;
};

export type CustomerCodeValidationResponse =
  | CustomerCodeValidationSuccessResponse
  | CustomerCodeValidationFailureResponse;

export class CustomerCodeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomerCodeValidationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRequiredString(
  value: Record<string, unknown>,
  key: keyof CustomerCodeSummary,
): string {
  const field = value[key];
  if (typeof field !== 'string' || !field.trim()) {
    throw new CustomerCodeValidationError('Sunucudan geçersiz abonelik bilgisi alındı.');
  }
  return field;
}

function readOptionalString(
  value: Record<string, unknown>,
  key: string,
): string | null {
  const field = value[key];
  if (field === null || field === undefined) return null;
  if (typeof field !== 'string' || !field.trim()) {
    throw new CustomerCodeValidationError('Sunucudan geçersiz abonelik bilgisi alındı.');
  }
  return field;
}

function readNonNegativeInteger(value: Record<string, unknown>, key: string): number {
  const field = value[key];
  if (!Number.isSafeInteger(field) || (field as number) < 0) {
    throw new CustomerCodeValidationError('Sunucudan geçersiz yenileme teklifi alındı.');
  }
  return field as number;
}

function readNonNegativeNumber(value: Record<string, unknown>, key: string): number {
  const field = value[key];
  if (typeof field !== 'number' || !Number.isFinite(field) || field < 0) {
    throw new CustomerCodeValidationError('Sunucudan geçersiz yenileme teklifi alındı.');
  }
  return field;
}

function readBankTransferString(
  value: Record<string, unknown>,
  key: string,
  required = false,
): string {
  const field = value[key];
  if (typeof field !== 'string' || (required && !field.trim())) {
    throw new CustomerCodeValidationError('Sunucudan geçersiz havale bilgisi alındı.');
  }
  return field;
}

function parseStoredBillingInfo(value: unknown): StoredRenewalBillingInfo | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) {
    throw new CustomerCodeValidationError('Sunucudan geçersiz fatura bilgisi alındı.');
  }
  const invoiceType = value.invoiceType;
  if (invoiceType !== 'individual' && invoiceType !== 'corporate') {
    throw new CustomerCodeValidationError('Sunucudan geçersiz fatura bilgisi alındı.');
  }
  const readText = (key: string): string => {
    const field = value[key];
    if (typeof field !== 'string') {
      throw new CustomerCodeValidationError('Sunucudan geçersiz fatura bilgisi alındı.');
    }
    return field;
  };

  return {
    invoiceType,
    fullName: readText('fullName'),
    name: readText('name'),
    phone: readText('phone'),
    city: readText('city'),
    district: readText('district'),
    openAddress: readText('openAddress'),
    address: readText('address'),
    ...(typeof value.identityNumber === 'string'
      ? { identityNumber: value.identityNumber }
      : {}),
    ...(typeof value.companyName === 'string' ? { companyName: value.companyName } : {}),
    ...(typeof value.taxNumber === 'string' ? { taxNumber: value.taxNumber } : {}),
    ...(typeof value.taxOffice === 'string' ? { taxOffice: value.taxOffice } : {}),
  };
}

function parseRenewalQuote(value: unknown): RenewalQuote {
  if (!isRecord(value)) {
    throw new CustomerCodeValidationError('Sunucudan geçersiz yenileme teklifi alındı.');
  }

  const periodLabel = value.periodLabel;
  const campaignEndsAt = value.campaignEndsAt;
  const normalPriceMessage = value.normalPriceMessage;

  if (typeof periodLabel !== 'string' || !periodLabel.trim()) {
    throw new CustomerCodeValidationError('Sunucudan geçersiz yenileme teklifi alındı.');
  }
  if (typeof value.campaignApplied !== 'boolean' || value.currency !== 'TRY') {
    throw new CustomerCodeValidationError('Sunucudan geçersiz yenileme teklifi alındı.');
  }
  if (
    campaignEndsAt !== null &&
    (typeof campaignEndsAt !== 'string' ||
      !campaignEndsAt.trim() ||
      Number.isNaN(Date.parse(campaignEndsAt)))
  ) {
    throw new CustomerCodeValidationError('Sunucudan geçersiz kampanya tarihi alındı.');
  }
  if (normalPriceMessage !== null && typeof normalPriceMessage !== 'string') {
    throw new CustomerCodeValidationError('Sunucudan geçersiz yenileme teklifi alındı.');
  }

  return {
    periodLabel,
    normalPriceKurus: readNonNegativeInteger(value, 'normalPriceKurus'),
    campaignApplied: value.campaignApplied,
    campaignDiscountRate: readNonNegativeNumber(value, 'campaignDiscountRate'),
    campaignDiscountAmountKurus: readNonNegativeInteger(value, 'campaignDiscountAmountKurus'),
    finalPriceKurus: readNonNegativeInteger(value, 'finalPriceKurus'),
    campaignEndsAt,
    currency: value.currency,
    normalPriceMessage,
  };
}

function readIsoDate(value: Record<string, unknown>, key: string): string {
  const field = value[key];
  if (typeof field !== 'string' || !field.trim() || Number.isNaN(Date.parse(field))) {
    throw new CustomerCodeValidationError('Sunucudan geçersiz tarih bilgisi alındı.');
  }
  return field;
}

function readOpaqueToken(
  value: Record<string, unknown>,
  key: string,
  minLength: number,
  maxLength: number,
): string {
  const field = value[key];
  if (
    typeof field !== 'string' ||
    field.length < minLength ||
    field.length > maxLength ||
    !field.trim()
  ) {
    throw new CustomerCodeValidationError('Sunucudan geçersiz ödeme oturumu alındı.');
  }
  return field;
}

function parseSuccessResponse(value: unknown): CustomerCodeSummary {
  if (!isRecord(value)) {
    throw new CustomerCodeValidationError('Sunucudan geçersiz yanıt alındı.');
  }

  if (value.success === false) {
    const message =
      typeof value.message === 'string' && value.message.trim()
        ? value.message
        : 'Müşteri kodu geçersiz. Lütfen kodu kontrol edin.';
    throw new CustomerCodeValidationError(message);
  }

  if (value.success !== true || !isRecord(value.data) || value.data.valid !== true) {
    throw new CustomerCodeValidationError('Sunucudan geçersiz yanıt alındı.');
  }

  const subscriptionEndsAt = readOptionalString(value.data, 'subscriptionEndsAt');
  if (subscriptionEndsAt && Number.isNaN(Date.parse(subscriptionEndsAt))) {
    throw new CustomerCodeValidationError('Sunucudan geçersiz abonelik tarihi alındı.');
  }
  const selectedProductType = value.data.selectedProductType;
  const selectedSubscriptionPeriod = value.data.selectedSubscriptionPeriod;
  const hasCompleteBillingInfo = value.data.hasCompleteBillingInfo === true;
  if (
    (selectedProductType !== 'monthly' && selectedProductType !== 'annual') ||
    !Number.isInteger(selectedSubscriptionPeriod) ||
    (selectedProductType === 'monthly' && selectedSubscriptionPeriod !== 0) ||
    (selectedProductType === 'annual' &&
      ![1, 2, 3].includes(selectedSubscriptionPeriod as number))
  ) {
    throw new CustomerCodeValidationError('Sunucudan geçersiz paket seçimi alındı.');
  }

  // Only copy the public display fields; any unexpected response fields are discarded.
  return {
    accountEmail: readOptionalString(value.data, 'accountEmail'),
    maskedName: readRequiredString(value.data, 'maskedName'),
    maskedEmail: readRequiredString(value.data, 'maskedEmail'),
    currentPackage: readOptionalString(value.data, 'currentPackage'),
    subscriptionEndsAt,
    barAssociationName: readOptionalString(value.data, 'barAssociationName'),
    checkoutToken: readOpaqueToken(value.data, 'checkoutToken', 32, 200),
    checkoutExpiresAt: readIsoDate(value.data, 'checkoutExpiresAt'),
    selectedProductType,
    selectedSubscriptionPeriod: selectedSubscriptionPeriod as number,
    hasCompleteBillingInfo,
    billingInfo: parseStoredBillingInfo(value.data.billingInfo),
    renewalQuote: parseRenewalQuote(value.data.renewalQuote),
  };
}

export async function validateCustomerCode(
  customerCode: string,
  signal?: AbortSignal,
): Promise<CustomerCodeSummary> {
  try {
    const response = await apiRequest<unknown>('/api/public/customer-code/validate', {
      method: 'POST',
      body: { customerCode },
      signal,
    });
    return parseSuccessResponse(response);
  } catch (error) {
    if (error instanceof CustomerCodeValidationError) throw error;

    const apiError = error as Partial<ApiError>;
    if (typeof apiError.status === 'number' && apiError.status > 0) {
      const responseBody = apiError.body;
      if (
        isRecord(responseBody) &&
        typeof responseBody.message === 'string' &&
        responseBody.message.trim()
      ) {
        throw new CustomerCodeValidationError(responseBody.message);
      }
      if (apiError.status === 400 || apiError.status === 404) {
        throw new CustomerCodeValidationError(
          'Müşteri kodu geçersiz. Lütfen kodu kontrol edin.',
        );
      }
    }

    throw error;
  }
}

export async function resolveRenewalSession(
  renewalToken: string,
  signal?: AbortSignal,
): Promise<CustomerCodeSummary> {
  const response = await apiRequest<unknown>('/api/payment/renewal/resolve', {
    method: 'POST',
    body: { renewalToken },
    signal,
  });
  if (!isRecord(response)) {
    throw new CustomerCodeValidationError('Yenileme oturumu doğrulanamadı.');
  }
  const data = isRecord(response.data) ? response.data : response;
  return parseSuccessResponse({
    success: response.success === true,
    data: {
      ...data,
      valid: data.valid === true,
      checkoutToken: renewalToken,
    },
  });
}

function parseRenewalPayment(value: unknown): RenewalPayment {
  if (!isRecord(value) || value.success !== true) {
    throw new CustomerCodeValidationError('Ödeme başlatılamadı. Lütfen tekrar deneyin.');
  }

  const merchantOid = value.merchantOid;
  if (typeof merchantOid !== 'string' || !merchantOid.trim()) {
    throw new CustomerCodeValidationError('Sunucudan geçersiz ödeme bilgisi alındı.');
  }
  if (value.currency !== 'TRY') {
    throw new CustomerCodeValidationError('Sunucudan geçersiz para birimi alındı.');
  }

  return {
    token: readOpaqueToken(value, 'token', 1, 500),
    merchantOid,
    chargedAmountKurus: readNonNegativeInteger(value, 'chargedAmountKurus'),
    currency: value.currency,
    renewalQuote: parseRenewalQuote(value.renewalQuote),
    testMode: value.testMode === true,
  };
}

export async function initiateCustomerCodeRenewalPayment(params: {
  checkoutToken: string;
  productType: 'monthly' | 'annual';
  subscriptionPeriod: number;
  billingInfo?: RenewalBillingInfo;
  legalConsents: Record<string, boolean>;
  signal?: AbortSignal;
}): Promise<RenewalPayment> {
  const response = await apiRequest<unknown>('/api/payment/paytr-token-guest', {
    method: 'POST',
    body: {
      renewalToken: params.checkoutToken,
      product_type: params.productType,
      subscriptionPeriod: params.subscriptionPeriod,
      ...(params.billingInfo ? { billingInfo: params.billingInfo } : {}),
      legalConsents: params.legalConsents,
    },
    signal: params.signal,
  });
  return parseRenewalPayment(response);
}

export async function fetchBankTransferAvailability(
  signal?: AbortSignal,
): Promise<BankTransferAvailability> {
  const response = await apiRequest<unknown>('/api/payment/bank-transfer-availability', {
    method: 'GET',
    signal,
  });
  if (!isRecord(response) || response.success !== true || typeof response.isActive !== 'boolean') {
    throw new CustomerCodeValidationError('Havale/EFT durumu doğrulanamadı.');
  }
  return { isActive: response.isActive };
}

function parseRenewalBankTransferOrder(value: unknown): RenewalBankTransferOrder {
  if (
    !isRecord(value) ||
    value.success !== true ||
    value.paymentMethod !== 'BANK_TRANSFER' ||
    value.status !== 'bank_transfer_pending' ||
    !isRecord(value.bankTransfer)
  ) {
    throw new CustomerCodeValidationError('Sunucudan geçersiz havale siparişi alındı.');
  }

  const amountFormatted = readBankTransferString(value, 'amountFormatted', true);
  const merchantOid = readBankTransferString(value, 'merchantOid', true);

  return {
    merchantOid,
    paymentMethod: 'BANK_TRANSFER',
    status: 'bank_transfer_pending',
    amount: readNonNegativeInteger(value, 'amount'),
    amountFormatted,
    renewalQuote: parseRenewalQuote(value.renewalQuote),
    bankTransfer: {
      bankName: readBankTransferString(value.bankTransfer, 'bankName'),
      accountHolderName: readBankTransferString(
        value.bankTransfer,
        'accountHolderName',
        true,
      ),
      iban: readBankTransferString(value.bankTransfer, 'iban', true),
      branchInfo: readBankTransferString(value.bankTransfer, 'branchInfo'),
      instructions: readBankTransferString(value.bankTransfer, 'instructions'),
      reference: readBankTransferString(value.bankTransfer, 'reference', true),
    },
  };
}

export async function createCustomerCodeRenewalBankTransferOrder(params: {
  checkoutToken: string;
  productType: 'monthly' | 'annual';
  subscriptionPeriod: number;
  billingInfo?: RenewalBillingInfo;
  legalConsents: Record<string, boolean>;
  signal?: AbortSignal;
}): Promise<RenewalBankTransferOrder> {
  const response = await apiRequest<unknown>('/api/payment/bank-transfer-order', {
    method: 'POST',
    body: {
      renewalToken: params.checkoutToken,
      product_type: params.productType,
      subscriptionPeriod: params.subscriptionPeriod,
      ...(params.billingInfo ? { billingInfo: params.billingInfo } : {}),
      legalConsents: params.legalConsents,
    },
    signal: params.signal,
  });
  return parseRenewalBankTransferOrder(response);
}

const RENEWAL_PAYMENT_STATES: ReadonlySet<string> = new Set([
  'PAYMENT_PENDING',
  'PAYMENT_FAILED',
  'FULFILLMENT_PENDING',
  'FULFILLMENT_FAILED',
  'COMPLETED',
]);

function parseRenewalPaymentStatus(value: unknown): RenewalPaymentStatus {
  if (!isRecord(value) || value.success !== true || !isRecord(value.data)) {
    throw new CustomerCodeValidationError('Ödeme durumu alınamadı.');
  }

  const state = value.data.state;
  if (typeof state !== 'string' || !RENEWAL_PAYMENT_STATES.has(state)) {
    throw new CustomerCodeValidationError('Sunucudan geçersiz ödeme durumu alındı.');
  }
  if (value.data.currency !== 'TRY') {
    throw new CustomerCodeValidationError('Sunucudan geçersiz para birimi alındı.');
  }

  const newSubscriptionEndsAt =
    state === 'COMPLETED'
      ? readIsoDate(value.data, 'newSubscriptionEndsAt')
      : null;

  return {
    state: state as RenewalPaymentState,
    chargedAmountKurus: readNonNegativeInteger(value.data, 'chargedAmountKurus'),
    currency: value.data.currency,
    newSubscriptionEndsAt,
  };
}

export async function fetchCustomerCodeRenewalStatus(
  checkoutToken: string,
  merchantOid: string,
  signal?: AbortSignal,
): Promise<RenewalPaymentStatus> {
  const response = await apiRequest<unknown>('/api/public/customer-code/renewal/status', {
    method: 'POST',
    body: { checkoutToken, merchantOid },
    signal,
  });
  return parseRenewalPaymentStatus(response);
}
