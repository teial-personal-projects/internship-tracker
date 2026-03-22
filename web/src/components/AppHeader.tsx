import { Box, Flex, HStack, Heading, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={20}
      boxShadow="lg"
      bg="brand.800"
    >
      <Flex
        align="center"
        justify="space-between"
        maxW="screen-2xl"
        mx="auto"
        px={{ base: 4, sm: 6 }}
        py={{ base: 6, sm: 8 }}
        gap={4}
      >
        {/* Logo */}
        <HStack spacing={3}>
          <Box
            w={10}
            h={10}
            borderRadius="lg"
            bg="accent.400"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="xl" lineHeight={1}>🚀</Text>
          </Box>
          <Box>
            <Heading
              as="h1"
              size="lg"
              color="white"
              letterSpacing="tight"
              lineHeight="tight"
            >
              LaunchPad
            </Heading>
            <Text fontSize="sm" color="whiteAlpha.800" fontWeight="medium" display={{ base: 'none', sm: 'block' }} mt={0.5}>
              your internship command center
            </Text>
          </Box>
        </HStack>

        {/* Right slot */}
        {children && <HStack spacing={3}>{children}</HStack>}
      </Flex>
    </Box>
  );
}
