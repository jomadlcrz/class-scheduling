import { Accordion } from "~/components/ui/accordion";
import type { LabRoom } from "~/types/lab-analysis";
import { LabRoomPlate } from "./lab-room-plate";

export function LabRoomPlates({ laboratories }: { laboratories: LabRoom[] }) {
  return (
    <Accordion>
      {laboratories.map((room, index) => (
        <LabRoomPlate key={room.roomId} room={room} defaultOpen={index === 0} />
      ))}
    </Accordion>
  );
}
