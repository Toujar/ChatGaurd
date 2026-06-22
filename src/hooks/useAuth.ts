import { useNavigate } from 'react-router-dom';
import { useAuthStore, useChatStore } from '@/store';
import { authApi, setTokens, clearTokens, getAccessToken } from '@/lib/api';
import type { User, Organization } from '@/types';

// Map backend UserDTO to frontend User type
function mapUser(dto: import('@/lib/api').UserDTO): User {
  return {
    id: dto.id,
    organization_id: dto.organizationId,
    full_name: dto.fullName,
    display_name: dto.displayName,
    avatar_url: dto.avatarUrl,
    role: dto.role.toLowerCase() as User['role'],
    status: dto.status.toLowerCase() as User['status'],
    risk_score: dto.riskScore,
    settings: {},
    created_at: dto.createdAt,
    updated_at: dto.createdAt,
  };
}

function mapOrganization(dto: import('@/lib/api').UserDTO): Organization | null {
  if (!dto.organizationId) return null;
  return {
    id: dto.organizationId,
    name: dto.organizationName,
    slug: dto.organizationName?.toLowerCase().replace(/\s+/g, '-') ?? '',
    logo_url: null,
    settings: {},
    protection_level: 'standard',
    created_at: dto.createdAt,
    updated_at: dto.createdAt,
  };
}

export function useAuth() {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isLoading,
    setUser,
    setOrganization,
    setLoading,
    logout: storeLogout,
  } = useAuthStore();
  const { setChannels } = useChatStore();

  async function checkAuth() {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const dto = await authApi.me();
      setUser(mapUser(dto));
      const org = mapOrganization(dto);
      if (org) setOrganization(org);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      setTokens(data.accessToken, data.refreshToken);
      setUser(mapUser(data.user));
      const org = mapOrganization(data.user);
      if (org) setOrganization(org);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function signUp(
    fullName: string,
    email: string,
    password: string,
    organizationName?: string,
  ) {
    setLoading(true);
    try {
      const data = await authApi.register(fullName, email, password, organizationName);
      setTokens(data.accessToken, data.refreshToken);
      setUser(mapUser(data.user));
      const org = mapOrganization(data.user);
      if (org) setOrganization(org);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    try {
      await authApi.logout();
    } catch {
      // best-effort
    } finally {
      clearTokens();
      storeLogout();
      setChannels([]);
      navigate('/login');
    }
  }

  return { user, isAuthenticated, isLoading, signIn, signUp, signOut, checkAuth };
}
