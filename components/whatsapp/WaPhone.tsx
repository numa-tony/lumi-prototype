import { WaPhoneFrame } from "./WaPhoneFrame";
import { WaHeader } from "./WaHeader";
import { WaConversation } from "./WaConversation";

export function WaPhone() {
  return (
    <WaPhoneFrame>
      <WaHeader />
      <WaConversation />
    </WaPhoneFrame>
  );
}
