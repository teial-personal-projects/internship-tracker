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
  Skeleton,
  Spinner,
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
      <FormLabel fontSize="sm">{label}</FormLabel>
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
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [major, setMajor] = useState('');
  const [positions, setPositions] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize form from loaded profile
  if (profile && !initialized) {
    setMajor(profile.major ?? '');
    setPositions(profile.positions ?? []);
    setLocations(profile.locations ?? []);
    setInitialized(true);
  }

  async function handleSave() {
    try {
      await updateProfile.mutateAsync({ major: major || null, positions, locations });
      toast({ title: 'Profile saved', status: 'success', duration: 2000 });
    } catch {
      toast({ title: 'Save failed', status: 'error', duration: 3000 });
    }
  }

  return (
    <Box minH="100vh" bg="blue.50">
      <Box
        as="header"
        boxShadow="lg"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 45%, #1a3254 100%)' }}
        px={6}
        py={4}
      >
        <HStack justify="space-between" maxW="800px" mx="auto">
          <HStack spacing={2}>
            <Text fontSize="2xl">💼</Text>
            <Heading
              size="md"
              color="white"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}
            >
              Internship Tracker
            </Heading>
          </HStack>
          <Button
            as={RouterLink}
            to="/"
            size="sm"
            bg="whiteAlpha.200"
            color="white"
            border="1px solid"
            borderColor="whiteAlpha.400"
            _hover={{ bg: 'whiteAlpha.300' }}
            leftIcon={<Text as="span" fontSize="sm">←</Text>}
          >
            Dashboard
          </Button>
        </HStack>
      </Box>

      <Container maxW="800px" py={8}>
        <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={8}>
          <Heading size="md" color="brand.700" mb={6}>
            User Profile
          </Heading>

          {isLoading ? (
            <Stack spacing={4}>
              <Skeleton height="40px" />
              <Skeleton height="80px" />
              <Skeleton height="80px" />
            </Stack>
          ) : (
            <Stack spacing={6}>
              <FormControl>
                <FormLabel fontSize="sm">Major</FormLabel>
                <Input
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="e.g. Computer Science"
                  focusBorderColor="brand.500"
                  size="sm"
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

              <HStack justify="flex-end">
                <Button
                  colorScheme="brand"
                  onClick={handleSave}
                  isLoading={updateProfile.isPending}
                  size="sm"
                >
                  Save Profile
                </Button>
              </HStack>
            </Stack>
          )}
        </Box>
      </Container>
    </Box>
  );
}
