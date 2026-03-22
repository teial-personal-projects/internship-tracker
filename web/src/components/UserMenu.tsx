import { useState, useRef, useEffect } from 'react';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleSignOut() {
    setLoading(true);
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  }

  if (!user) return null;

  const initial = user.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <Box position="relative" ref={ref}>
      {/* Trigger button */}
      <Button
        variant="outline"
        size="sm"
        borderColor="gray.300"
        bg="white"
        color="gray.700"
        fontWeight="medium"
        onClick={() => setIsOpen((v) => !v)}
        _hover={{ bg: 'gray.50' }}
        px={2}
        gap={2}
      >
        {/* Avatar circle */}
        <Flex
          align="center"
          justify="center"
          w={8}
          h={8}
          bg="blue.600"
          color="white"
          borderRadius="full"
          fontSize="xs"
          fontWeight="semibold"
          flexShrink={0}
        >
          {initial}
        </Flex>

        {/* Email — hidden on small screens */}
        <Text
          display={{ base: 'none', sm: 'block' }}
          maxW="150px"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          fontSize="sm"
        >
          {user.email}
        </Text>

        {/* Chevron */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
          aria-hidden="true"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <Box
          position="absolute"
          right={0}
          zIndex={20}
          mt={2}
          w="56"
          minW="224px"
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="lg"
        >
          {/* Signed in as */}
          <Box px={4} py={3} borderBottom="1px solid" borderColor="gray.200">
            <Text fontSize="sm" fontWeight="medium" color="gray.900">Signed in as</Text>
            <Text fontSize="sm" color="gray.600" mt={1} noOfLines={1}>{user.email}</Text>
          </Box>

          {/* Sign out */}
          <Box p={2}>
            <Button
              variant="ghost"
              w="full"
              justifyContent="flex-start"
              fontSize="sm"
              color="red.600"
              gap={2}
              px={3}
              py={2}
              borderRadius="md"
              isLoading={loading}
              loadingText="Signing out…"
              onClick={handleSignOut}
              _hover={{ bg: 'red.50' }}
              _focus={{ ring: 2, ringColor: 'red.600', ringInset: 'inset' }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
