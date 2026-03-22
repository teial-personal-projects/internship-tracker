import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  Alert,
  AlertIcon,
  Center,
  VStack,
} from '@chakra-ui/react';
import { supabase } from '@/lib/supabaseClient';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) setError(error.message);
        else setMessage('Check your email to confirm your account.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Center minH="100vh" bg="gray.50">
      <Box
        bg="white"
        p={8}
        borderRadius="xl"
        boxShadow="lg"
        w="full"
        maxW="400px"
      >
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading size="lg" color="brand.700">
              Internship Tracker
            </Heading>
            <Text color="gray.500" mt={1} fontSize="sm">
              {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
            </Text>
          </Box>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          {message && (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              {message}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  focusBorderColor="brand.500"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  focusBorderColor="brand.500"
                />
              </FormControl>
              <Button type="submit" colorScheme="brand" isLoading={loading}>
                {mode === 'login' ? 'Sign In' : 'Sign Up'}
              </Button>
            </Stack>
          </form>

          <Text textAlign="center" fontSize="sm" color="gray.600">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <Button
              variant="link"
              colorScheme="brand"
              fontSize="sm"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </Button>
          </Text>
        </VStack>
      </Box>
    </Center>
  );
}
