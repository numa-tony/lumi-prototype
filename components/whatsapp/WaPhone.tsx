import { WaPhoneFrame } from "./WaPhoneFrame";
import { WaHeader } from "./WaHeader";
import { WaConversation } from "./WaConversation";
import { WaStoryView } from "./WaStoryView";

export function WaPhone({ demoActive }: { demoActive?: boolean }) {
  return (
    <WaPhoneFrame>
      <WaHeader />
      {demoActive ? <WaStoryView /> : <WaConversation />}
    </WaPhoneFrame>
  );
}
