import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Input,
  SimpleGrid,
  Skeleton,
  Stack,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  useToast,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { UserMenu } from '@/components/UserMenu';
import { supabase } from '@/lib/supabaseClient';

function TagInput({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState('');

  function addTag() {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput('');
  }

  function removeTag(tag: string) {
    onChange(values.filter((v) => v !== tag));
  }

  return (
    <FormControl>
      <FormLabel fontSize="xs" fontWeight="semibold" color="brand.700" textTransform="uppercase" letterSpacing="wider">{label}</FormLabel>
      <Wrap mb={2}>
        {values.map((v) => (
          <WrapItem key={v}>
            <Tag colorScheme="brand" borderRadius="full" size="sm">
              <TagLabel>{v}</TagLabel>
              <TagCloseButton onClick={() => removeTag(v)} />
            </Tag>
          </WrapItem>
        ))}
      </Wrap>
      <HStack>
        <Input
          size="sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); addTag(); }
          }}
          placeholder={`Add ${label.toLowerCase()} and press Enter`}
          focusBorderColor="brand.500"
        />
        <Button size="sm" colorScheme="brand" variant="outline" onClick={addTag}>
          Add
        </Button>
      </HStack>
    </FormControl>
  );
}

export function ProfilePage() {
  const toast = useToast();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [major, setMajor] = useState('');
  const [positions, setPositions] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize form from loaded profile + auth metadata
  if ((profile || user) && !initialized) {
    setFirstName(user?.user_metadata?.first_name ?? '');
    setLastName(user?.user_metadata?.last_name ?? '');
    setMajor(profile?.major ?? '');
    setPositions(profile?.positions ?? []);
    setLocations(profile?.locations ?? []);
    setInitialized(true);
  }

  async function handleSave() {
    try {
      await Promise.all([
        updateProfile.mutateAsync({ major: major || null, positions, locations }),
        supabase.auth.updateUser({ data: { first_name: firstName || null, last_name: lastName || null } }),
      ]);
      toast({ title: 'Profile saved', status: 'success', duration: 2000 });
    } catch {
      toast({ title: 'Save failed', status: 'error', duration: 3000 });
    }
  }

  return (
    <Box minH="100vh" bg="#F5F5F3">
      <AppHeader>
        <Button
          as={RouterLink}
          to="/"
          size="sm"
          bg="transparent"
          color="accent.200"
          border="1.5px solid"
          borderColor="accent.400"
          _hover={{ bg: 'whiteAlpha.100' }}
          leftIcon={<Text as="span" fontSize="sm">←</Text>}
        >
          Dashboard
        </Button>
        <UserMenu />
      </AppHeader>

      <Container maxW="800px" py={8}>
        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="brand.100" overflow="hidden">
          {/* Card header */}
          <Box bg="brand.50" borderBottom="2px solid" borderColor="brand.200" px={8} py={4}>
            <Heading size="md" color="brand.800">
              User Profile
            </Heading>
          </Box>

          <Box px={8} py={6}>
            {isLoading ? (
              <Stack spacing={4}>
                <Skeleton height="40px" />
                <Skeleton height="80px" />
                <Skeleton height="80px" />
              </Stack>
            ) : (
              <Stack spacing={6}>
                <SimpleGrid columns={2} spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="semibold" color="brand.700" textTransform="uppercase" letterSpacing="wider">First Name</FormLabel>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      focusBorderColor="brand.500"
                      size="sm"
                      borderRadius="md"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="semibold" color="brand.700" textTransform="uppercase" letterSpacing="wider">Last Name</FormLabel>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Smith"
                      focusBorderColor="brand.500"
                      size="sm"
                      borderRadius="md"
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="semibold" color="brand.700" textTransform="uppercase" letterSpacing="wider">Major</FormLabel>
                  <Input
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="e.g. Computer Science"
                    focusBorderColor="brand.500"
                    size="sm"
                    borderRadius="md"
                  />
                </FormControl>

                <TagInput
                  label="Positions Looking For"
                  values={positions}
                  onChange={setPositions}
                />

                <TagInput
                  label="Preferred Locations"
                  values={locations}
                  onChange={setLocations}
                />

                <HStack justify="flex-end" pt={2} borderTop="1px solid" borderColor="gray.100">
                  <Button
                    colorScheme="brand"
                    onClick={handleSave}
                    isLoading={updateProfile.isPending}
                    size="sm"
                    px={6}
                  >
                    Save Profile
                  </Button>
                </HStack>
              </Stack>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
