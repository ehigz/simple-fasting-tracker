# CLAUDE.md — InterFastApp

## Project Overview

**InterFastApp** is a native Android dApp for the Solana Seeker phone. It's a fasting tracker that connects to Solana wallets via Mobile Wallet Adapter.

**Stack:**
- React Native 0.76 + Expo SDK 52
- Solana Mobile Wallet Adapter (`@solana-mobile/mobile-wallet-adapter-protocol`)
- @solana/web3.js for blockchain interactions
- NativeWind (Tailwind CSS for React Native)
- React Query for state management
- Reanimated for animations

**Target:** Solana Seeker (Android) — optimized for mobile-first crypto UX.

---

## Agent Expertise

You are an expert in:

### 1. Web-to-Native Solana App Conversion
- Converting React web apps to React Native + Expo
- Replacing web dependencies with mobile equivalents
- Implementing Solana Mobile Wallet Adapter (MWA)
- Handling mobile-specific crypto flows (deep links, wallet authorization)
- NativeWind styling (Tailwind → React Native)

### 2. Solana Smart Contract Development
- **Anchor Framework** — the standard for Solana programs
- Program Derived Addresses (PDAs)
- Cross-Program Invocations (CPIs)
- Token programs (SPL Token, Token-2022)
- Account validation and security patterns
- IDL generation and client integration

### 3. React Native + Expo
- Expo SDK 52 APIs and managed workflow
- EAS Build for Android/iOS
- Native module integration
- Performance optimization (Reanimated, memo patterns)
- AsyncStorage for local persistence

### 4. Solana Mobile Stack
- Mobile Wallet Adapter protocol
- Seed Vault integration (Seeker hardware)
- Transaction signing flows
- Session management and auth tokens
- Devnet/Mainnet cluster switching

---

## Skills (Auto-Invoke)

### codebase-index
**When:** Pointed at an unfamiliar project or asked how things connect.
**Action:** Map the codebase structure before diving into implementation.

### problem-mapping
**When:** Problem is fuzzy, multi-stakeholder, or strategic.
**Action:** Frame the problem clearly before attempting solutions. Define users, constraints, success criteria.

### troubleshooting-framework
**When:** Build failures, dependency conflicts, environment issues — especially when going in circles.
**Action:** Use systematic diagnosis. Validate environment first. Choose fix-in-place vs start-fresh based on root cause.

---

## Project Structure

```
InterFastApp/
├── App.tsx                 # Entry point, providers, routing
├── src/
│   ├── components/
│   │   ├── FastingTracker.tsx    # Main fasting UI
│   │   ├── FastingZone.tsx       # Individual zone cards
│   │   ├── WalletConnect.tsx     # Wallet connection flow
│   │   ├── DisclaimerModal.tsx   # Legal disclaimer
│   │   ├── SunriseBackground.tsx # Animated gradient background
│   │   └── cluster/
│   │       └── cluster-data-access.tsx  # Solana cluster config
│   └── utils/
│       ├── useAuthorization.ts   # MWA auth state + persistence
│       ├── useMobileWallet.ts    # Wallet actions (connect/sign/send)
│       ├── ConnectionProvider.tsx # Solana RPC connection
│       ├── fasting.ts            # Fasting zones data + helpers
│       ├── alertAndLog.ts        # Error handling utility
│       └── ellipsify.ts          # Address truncation
├── android/                # Native Android project (prebuild)
├── global.css              # Tailwind/NativeWind styles
├── tailwind.config.js      # Tailwind configuration
└── package.json
```

---

## Key Patterns

### Wallet Authorization Flow
```typescript
// Connect wallet via MWA
const { connect } = useMobileWallet();
const account = await connect();

// Sign and send transaction
const signature = await signAndSendTransaction(transaction, minContextSlot);
```

### Persisted State (Per-Wallet)
```typescript
// Storage key scoped to wallet public key
const storageKey = `fasting_${selectedAccount.publicKey.toBase58()}`;
await AsyncStorage.setItem(storageKey, JSON.stringify(data));
```

### Cluster Configuration
- Default: Devnet
- Supports: Devnet, Testnet, Mainnet
- Explorer URLs auto-generated per cluster

---

## Build Commands

```bash
# Development
npm run start           # Expo dev server
npm run android         # Run on Android device/emulator

# Production builds (EAS)
npm run build           # EAS cloud build (dev profile)
npm run build:local     # Local build (requires Android SDK)
```

---

## Common Issues & Solutions

### "No wallet found"
- Ensure a Solana wallet app is installed (Phantom, Solflare, or Seed Vault on Seeker)
- Check MWA is properly configured in `app.json`

### Build fails with Gradle errors
- Run `cd android && ./gradlew clean`
- Check Java version (requires JDK 17+)
- Verify `android/local.properties` has correct SDK path

### NativeWind styles not applying
- Ensure `babel.config.js` includes NativeWind preset
- Run `npx expo start --clear` to reset cache
- Check `tailwind.config.js` content paths

### Transaction signing fails
- Verify cluster matches wallet network
- Check RPC endpoint is accessible
- Ensure sufficient SOL for fees (devnet: use faucet)

---

## Design System

All UI primitives live in `src/ui/`. Always import from there when building new screens.

```typescript
import { Card, Button, Overline, FieldLabel, CardTitle, BodyText, MutedText, Divider, colors, radius } from "../ui";
```

### Primitives

| Component | Usage |
| --- | --- |
| `<Card>` | Standard white card. `variant="default"` (rounded-3xl p-6) or `"sm"` (rounded-2xl p-5) |
| `<Button variant="primary">` | Full-width filled CTA. Handles `disabled` + `loading` states |
| `<Button variant="secondary">` | Light purple bg + border. Secondary actions (e.g. Copy Address) |
| `<Button variant="ghost">` | Border only. Low-emphasis actions (e.g. Disconnect) |
| `<Overline>` | `✦ Track Your Journey ✦` — all-caps overline with star decorators |
| `<FieldLabel>` | All-caps label above inputs or stat pairs ("Start Date", "Fasting Since") |
| `<CardTitle>` | Primary card heading (text-2xl semibold) |
| `<BodyText>` | Muted body/description copy (text-base relaxed) |
| `<MutedText>` | Small muted text — subtitles, helpers, timestamps |
| `<Divider>` | Hairline `h-px` separator |

### Colors (`colors.*` from `src/ui/theme.ts`)

Use in `StyleSheet.create()` and icon `color` props — never hardcode hex strings.

| Token | Value | Use |
| --- | --- | --- |
| `colors.primary` | `#340247` | Main text, icons, borders |
| `colors.accentPurple` | `#6e5fa7` | Secondary icon/text tint |
| `colors.accentLight` | `#a89fc9` | Inactive tab icons |
| `colors.mutedFg` | `#6b6b7e` | Muted/secondary text |
| `colors.tabBarBg` | `rgba(255,255,255,0.92)` | Tab bar background |
| `colors.tabBarBorder` | `rgba(52,2,71,0.12)` | Tab bar top border |

### NativeWind tokens (use directly as `className`)

`primary`, `secondary`, `muted`, `muted-fg`, `accent`, `accent-purple`, `accent-light`, `surface`, `warn`, `warn-border`, `warn-icon` — all defined in `tailwind.config.js`.

### Card anatomy

```tsx
<Card className="gap-6">
  <View className="items-center gap-3">
    <Overline>✦ Section Title ✦</Overline>
    <CardTitle className="text-center">Heading</CardTitle>
    <BodyText className="text-center">Description copy.</BodyText>
  </View>
  <Divider />
  <Button variant="primary" label="Action" onPress={...} />
</Card>
```

### Icon container

Lucide icons are always displayed in a rounded container — never bare.

```tsx
<View className="w-16 h-16 bg-secondary rounded-2xl items-center justify-center">
  <Clock size={32} color={colors.primary} />
</View>
```

- Size: `w-16 h-16` (64px), `rounded-2xl`
- Background: `bg-secondary` (`#f4ecff`)
- Icon size: 32, color: `colors.primary`
- Never use emoji as icons — always use Lucide icons with `colors.*` tokens

### Empty state anatomy

```tsx
<Card className="items-center gap-4">
  <View className="w-16 h-16 bg-secondary rounded-2xl items-center justify-center">
    <SomeLucideIcon size={32} color={colors.primary} />
  </View>
  <View className="items-center gap-2">
    <CardTitle className="text-center">Nothing here yet</CardTitle>
    <BodyText className="text-center">
      Helpful description of what will appear and how to get started.
    </BodyText>
  </View>
</Card>
```

---

## Compliance Rules

> Full detail: see `COMPLIANCE.md` at the project root.

### Hard constraints (v1 — no exceptions without human sign-off)
- **No network calls** — zero HTTP/WebSocket requests from the app
- **No third-party SDKs** — no Firebase, Sentry, Mixpanel, Amplitude, Crashlytics, etc.
- **No wallet integration in v1** — wallet code lives in `feat/wallet-connect` branch only
- **No user accounts or persistent identifiers**
- **No medical advice language** — all content must be informational/community framing

### Prohibited content patterns
- "You should..." / "We recommend..." / "Break your fast with..." (directive language)
- Any instruction framed as a personal health directive

### Compliance trigger phrases — pause and flag before implementing
If asked to implement: analytics, backend, cloud storage, wallet, push notifications, user accounts, crash reporting, or ads — respond with the flag message in `COMPLIANCE.md` and do not proceed.

---

## Next Steps (Roadmap)

1. **On-chain fasting records** — Store fasting sessions as Solana account data
2. **Achievement NFTs** — Mint NFTs for fasting milestones
3. **Social features** — Share progress, leaderboards
4. **Token rewards** — Incentive mechanisms for consistency

---

## Development Philosophy

- **Mobile-first:** Every interaction optimized for touch
- **Wallet-centric:** User identity = wallet address
- **Offline-capable:** Core tracking works without network
- **Beautiful defaults:** Smooth animations, thoughtful gradients
