import * as Formy from "ui/components/form/Formy";

export default function FormyTest() {
   return (
      <div className="flex flex-col gap-3">
         formy
         <Formy.Group>
            <Formy.Label>label</Formy.Label>
            <Formy.Switch onCheckedChange={console.log} />
         </Formy.Group>
         <Formy.Group>
            <Formy.Label>label</Formy.Label>
            <Formy.Input />
         </Formy.Group>
      </div>
   );
}
