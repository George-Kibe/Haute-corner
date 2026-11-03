// Shapes from docs/API.md.
export type Address = {
  line1: string;
  area: string | null;
  city: string;
  notes: string | null;
};

export type SignInMethod = 'google' | 'apple' | 'email';

export type SellerStatus = 'applied' | 'approved' | 'rejected' | 'suspended';

export type User = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  phone: string | null;
  deliveryAddress: Address | null;
  role: 'customer' | 'admin';
  signInMethods: SignInMethod[];
  seller: { id: string; status: SellerStatus } | null;
};

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};

export type SignInResult = SessionTokens & { user: User };

// null clears a field.
export type ProfileChanges = {
  name?: string;
  phone?: string | null;
  deliveryAddress?: { line1: string; area?: string; city: string; notes?: string } | null;
};
