import { View } from "react-native";
import { useState } from "react";
import { useMobileWallet } from "../utils/useMobileWallet";
import { alertAndLog } from "../utils/alertAndLog";
import { Card, Button, Overline, CardTitle, BodyText, Divider } from "../ui";

export function WalletConnect() {
  const { connect } = useMobileWallet();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      await connect();
    } catch (err: any) {
      alertAndLog(
        "Connection failed",
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setConnecting(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-2">
      <Card className="gap-6">
        <View className="items-center gap-3">
          <Overline>&#10022; Connect to Begin &#10022;</Overline>
          <CardTitle className="text-center">Simple Fasting Tracker</CardTitle>
          <BodyText className="text-center">
            Connect your Solana wallet to start tracking your fasting journey.
          </BodyText>
        </View>
        <Divider />
        <Button
          variant="primary"
          label="Connect Wallet"
          onPress={handleConnect}
          loading={connecting}
        />
      </Card>
    </View>
  );
}
