import { Button, Modal, Switch, Tooltip, useMantineColorScheme } from "@mantine/core";
import { useColorScheme, useDisclosure } from "@mantine/hooks";
import { Button as AppButton } from "../../../components/buttons/Button";

export default function MantineTest() {
   return (
      <div className="p-4 flex flex-col gap-2 items-start">
         <h1>mantine</h1>
         <div className="flex flex-row gap-2 justify-center content-center items-center">
            <Button color="blue">Mantine</Button>
            <AppButton>Button</AppButton>
            <AppButton variant="primary">Button</AppButton>
         </div>
         <MantineModal />
         <MantineTooltip />
         <Switch defaultChecked label="I agree to sell my privacy" />
      </div>
   );
}

function MantineModal() {
   const [opened, { open, close }] = useDisclosure(false);

   return (
      <>
         <Modal opened={opened} onClose={close} title="Authentication">
            <div>Modal content</div>
         </Modal>

         <Button onClick={open}>Open modal</Button>
      </>
   );
}

function MantineTooltip() {
   const { colorScheme } = useMantineColorScheme();
   return (
      <Tooltip label="Tooltip">
         <span>Hover me ({colorScheme})</span>
      </Tooltip>
   );
}
