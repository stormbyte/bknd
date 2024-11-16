import { useDisclosure } from "@mantine/hooks";
import { Modal } from "../../../components/overlay/Modal";

export default function ModalTest() {
   const [opened, { open, close }] = useDisclosure(true);

   return (
      <div className="flex flex-col w-full h-full justify-center items-center">
         <button onClick={open}>Open</button>
         <Modal open={opened} onClose={close}>
            <div className="border-blue-500 border-2 p-10">
               Modal content <button onClick={close}>close</button>
            </div>
         </Modal>
      </div>
   );
}
