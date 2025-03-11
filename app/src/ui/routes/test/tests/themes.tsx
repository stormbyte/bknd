import { Button } from "ui/components/buttons/Button";
import { Alert } from "ui/components/display/Alert";
import * as Formy from "ui/components/form/Formy";

export default function Themes() {
   return (
      <div className="flex flex-col p-3 gap-4">
         <div className="flex flex-row gap-2 items-center">
            <Button size="small">Small</Button>
            <Button>Default</Button>
            <Button variant="primary">Primary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="red">Red</Button>
            <Button variant="subtlered">Subtlered</Button>
            <Button size="large">Large</Button>
         </div>
         <div className="flex flex-row gap-1">
            <Alert.Exception title="Exception">Alert.Exception</Alert.Exception>
            <Alert.Info title="Info">Alert.Info</Alert.Info>
            <Alert.Success title="Success">Alert.Success</Alert.Success>
            <Alert.Warning title="Warning">Alert.Warning</Alert.Warning>
         </div>
         <div className="flex flex-row gap-3 items-start">
            <Formy.Group>
               <Formy.Label>Input</Formy.Label>
               <Formy.Input placeholder="Input" />
            </Formy.Group>
            <Formy.Group>
               <Formy.Label>Checkbox</Formy.Label>
               <Formy.BooleanInput />
            </Formy.Group>
            <Formy.Group>
               <Formy.Label>Switch</Formy.Label>
               <Formy.Switch />
            </Formy.Group>
            <Formy.Group>
               <Formy.Label>Select</Formy.Label>
               <Formy.Select>
                  <option value="" />
                  <option value="1">Option 1</option>
                  <option value="2">Option 2</option>
               </Formy.Select>
            </Formy.Group>
         </div>
      </div>
   );
}
