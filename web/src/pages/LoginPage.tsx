import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Stack,
  Text,
  Flex,
  Progress,
} from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';

// ── Password strength ──────────────────────────────────────────────────────

function validatePassword(pwd: string): string | null {
  if (pwd.length < 8) return 'At least 8 characters';
  if (!/[A-Z]/.test(pwd)) return 'Needs an uppercase letter';
  if (!/[a-z]/.test(pwd)) return 'Needs a lowercase letter';
  if (!/[0-9]/.test(pwd)) return 'Needs a number';
  return null;
}

function getStrength(pwd: string): 'weak' | 'medium' | 'strong' | null {
  if (!pwd) return null;
  if (validatePassword(pwd)) return 'weak';
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'strong';
  return 'medium';
}

const STRENGTH_COLOR = { weak: 'red.400', medium: 'orange.400', strong: 'green.500' } as const;
const STRENGTH_VALUE = { weak: 33, medium: 66, strong: 100 } as const;

// ── Shared input style ─────────────────────────────────────────────────────

const inputStyle = {
  border: '1px solid',
  borderColor: 'slate.200',
  borderRadius: 'lg',
  fontSize: 'sm',
  py: 6,
  pl: 10,
  _focus: { ring: 2, ringColor: 'blue.500', borderColor: 'transparent' },
  _placeholder: { color: 'gray.400' },
  _disabled: { opacity: 0.6 },
};

// ── Login form ─────────────────────────────────────────────────────────────

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Box mb={6}>
        <Text
          fontSize="2xl"
          fontWeight="bold"
          color="#1e3a5f"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Welcome back
        </Text>
        <Text fontSize="sm" color="gray.500" mt={1}>
          Sign in to continue tracking internships
        </Text>
      </Box>

      {error && (
        <Box mb={4} p={3} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="lg">
          <Text fontSize="sm" color="red.600">{error}</Text>
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={4}>
          <FormControl isRequired>
            <FormLabel fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={1}>
              Email Address
            </FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none" h="full" pl={1}>
                <Text fontSize="md">✉️</Text>
              </InputLeftElement>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                {...inputStyle}
              />
            </InputGroup>
          </FormControl>

          <FormControl isRequired>
            <Flex justify="space-between" align="center" mb={1}>
              <FormLabel fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={0}>
                Password
              </FormLabel>
            </Flex>
            <InputGroup>
              <InputLeftElement pointerEvents="none" h="full" pl={1}>
                <Text fontSize="md">🔒</Text>
              </InputLeftElement>
              <Input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                disabled={loading}
                {...inputStyle}
                pr={16}
              />
              <InputRightElement width="4rem" h="full">
                <Button
                  size="xs"
                  variant="ghost"
                  color="blue.600"
                  fontWeight="medium"
                  onClick={() => setShowPwd((v) => !v)}
                  tabIndex={-1}
                >
                  {showPwd ? 'Hide' : 'Show'}
                </Button>
              </InputRightElement>
            </InputGroup>
          </FormControl>

          <Box pt={1}>
            <Button
              type="submit"
              w="full"
              bg="gray.800"
              color="white"
              fontWeight="semibold"
              fontSize="sm"
              borderRadius="lg"
              py={6}
              isLoading={loading}
              loadingText="Signing in…"
              _hover={{ bg: 'gray.900' }}
              _active={{ bg: 'gray.900' }}
              _focus={{ ring: 2, ringColor: 'gray.700', ringOffset: 2 }}
            >
              Sign In →
            </Button>
          </Box>
        </Stack>
      </form>

      <Box mt={6} pt={5} borderTop="1px solid" borderColor="gray.100" textAlign="center">
        <Text fontSize="sm" color="gray.500">
          Don't have an account?{' '}
          <Button variant="link" color="blue.600" fontWeight="semibold" fontSize="sm" onClick={onSwitch}
            _hover={{ color: 'blue.700' }}>
            Sign up free
          </Button>
        </Text>
      </Box>
    </>
  );
}

// ── Signup form ────────────────────────────────────────────────────────────

function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const strength = getStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const pwdErr = validatePassword(password);
    if (!firstName.trim() || !lastName.trim()) { setError('First and last name are required'); return; }
    if (pwdErr) { setError(pwdErr); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await signUp(email, password, firstName.trim(), lastName.trim());
      setMessage('Check your email to confirm your account.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Box mb={6}>
        <Text
          fontSize="2xl"
          fontWeight="bold"
          color="gray.900"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Create account
        </Text>
        <Text fontSize="sm" color="gray.500" mt={1}>
          Start tracking your internship applications
        </Text>
      </Box>

      {error && (
        <Box mb={4} p={3} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="lg">
          <Text fontSize="sm" color="red.600">{error}</Text>
        </Box>
      )}
      {message && (
        <Box mb={4} p={3} bg="green.50" border="1px solid" borderColor="green.200" borderRadius="lg">
          <Text fontSize="sm" color="green.700">{message}</Text>
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={4}>
          <Flex gap={3}>
            <FormControl isRequired>
              <FormLabel fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={1}>
                First Name
              </FormLabel>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                disabled={loading}
                {...inputStyle}
                pl={3}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={1}>
                Last Name
              </FormLabel>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                disabled={loading}
                {...inputStyle}
                pl={3}
              />
            </FormControl>
          </Flex>

          <FormControl isRequired>
            <FormLabel fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={1}>
              Email Address
            </FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none" h="full" pl={1}>
                <Text fontSize="md">✉️</Text>
              </InputLeftElement>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                {...inputStyle}
              />
            </InputGroup>
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={1}>
              Password
            </FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none" h="full" pl={1}>
                <Text fontSize="md">🔒</Text>
              </InputLeftElement>
              <Input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                disabled={loading}
                {...inputStyle}
                pr={16}
              />
              <InputRightElement width="4rem" h="full">
                <Button
                  size="xs"
                  variant="ghost"
                  color="blue.600"
                  fontWeight="medium"
                  onClick={() => setShowPwd((v) => !v)}
                  tabIndex={-1}
                >
                  {showPwd ? 'Hide' : 'Show'}
                </Button>
              </InputRightElement>
            </InputGroup>
            {strength && (
              <Box mt={2}>
                <Flex align="center" gap={2}>
                  <Progress
                    value={STRENGTH_VALUE[strength]}
                    size="xs"
                    flex={1}
                    borderRadius="full"
                    colorScheme={strength === 'weak' ? 'red' : strength === 'medium' ? 'orange' : 'green'}
                    bg="gray.200"
                  />
                  <Text fontSize="xs" fontWeight="medium" color={STRENGTH_COLOR[strength]}>
                    {strength.charAt(0).toUpperCase() + strength.slice(1)}
                  </Text>
                </Flex>
              </Box>
            )}
            <Text fontSize="xs" color="gray.400" mt={1}>
              8+ characters with uppercase, lowercase, and numbers
            </Text>
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={1}>
              Confirm Password
            </FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none" h="full" pl={1}>
                <Text fontSize="md">🔒</Text>
              </InputLeftElement>
              <Input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••••"
                disabled={loading}
                {...inputStyle}
                pr={16}
              />
              <InputRightElement width="4rem" h="full">
                <Button
                  size="xs"
                  variant="ghost"
                  color="blue.600"
                  fontWeight="medium"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                >
                  {showConfirm ? 'Hide' : 'Show'}
                </Button>
              </InputRightElement>
            </InputGroup>
          </FormControl>

          <Box pt={1}>
            <Button
              type="submit"
              w="full"
              bg="gray.800"
              color="white"
              fontWeight="semibold"
              fontSize="sm"
              borderRadius="lg"
              py={6}
              isLoading={loading}
              loadingText="Creating account…"
              _hover={{ bg: 'gray.900' }}
              _active={{ bg: 'gray.900' }}
              _focus={{ ring: 2, ringColor: 'gray.700', ringOffset: 2 }}
            >
              Create Account →
            </Button>
          </Box>
        </Stack>
      </form>

      <Box mt={6} pt={5} borderTop="1px solid" borderColor="gray.100" textAlign="center">
        <Text fontSize="sm" color="gray.500">
          Already have an account?{' '}
          <Button variant="link" color="blue.600" fontWeight="semibold" fontSize="sm" onClick={onSwitch}
            _hover={{ color: 'blue.700' }}>
            Sign in
          </Button>
        </Text>
      </Box>
    </>
  );
}

// ── Page shell ─────────────────────────────────────────────────────────────

export function LoginPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  return (
    <Flex
      minH="100vh"
      flexDir="column"
      align="center"
      justify="center"
      px={4}
      py={10}
      style={{
        background: 'linear-gradient(160deg, #1e3a5f 0%, #2c5282 40%, #dbe6f5 70%, #f0f4f8 100%)',
      }}
    >
      {/* Logo + tagline */}
      <Box textAlign="center" mb={8}>
        <Flex align="center" justify="center" gap={2} mb={2}>
          <Text fontSize="4xl">💼</Text>
          <Text
            fontSize="3xl"
            fontWeight="bold"
            color="white"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Internship Tracker
          </Text>
        </Flex>
        <Text fontSize="sm" color="blue.200">
          Track every application, never miss a deadline
        </Text>
      </Box>

      {/* Card */}
      <Box w="full" maxW="md" bg="white" borderRadius="2xl" boxShadow="2xl" overflow="hidden">
        {/* Tabs */}
        <Flex borderBottom="1px solid" borderColor="gray.200">
          {(['login', 'signup'] as const).map((t) => (
            <Button
              key={t}
              flex={1}
              variant="unstyled"
              py={4}
              fontSize="sm"
              fontWeight="semibold"
              borderRadius={0}
              color={tab === t ? 'gray.900' : 'gray.400'}
              borderBottom={tab === t ? '2px solid' : 'none'}
              borderBottomColor="gray.800"
              onClick={() => setTab(t)}
              _hover={{ color: tab === t ? 'gray.900' : 'gray.600' }}
              transition="color 0.15s"
            >
              {t === 'login' ? 'Sign In' : 'Sign Up'}
            </Button>
          ))}
        </Flex>

        {/* Form body */}
        <Box p={8}>
          {tab === 'login'
            ? <LoginForm onSwitch={() => setTab('signup')} />
            : <SignupForm onSwitch={() => setTab('login')} />
          }
        </Box>

        {/* Trust footer */}
        <Flex px={8} pb={6} justify="center" align="center" gap={4} fontSize="xs" color="gray.400">
          <Text>🔒 Secure</Text>
          <Text>· Free to use ·</Text>
          <Text>💼 Career focused</Text>
        </Flex>
      </Box>
    </Flex>
  );
}
