import { Dropdown } from "../../../components/overlay/Dropdown";

export default function DropdownTest() {
   return (
      <div className="flex flex-col w-full h-full justify-center items-center">
         <Dropdown
            items={[
               { label: "Item 1", value: "item1" },
               { label: "Item 2", value: "item2" },
               { label: "Item 3", value: "item3" },
            ]}
         >
            <button>Dropdown</button>
         </Dropdown>
      </div>
   );
}
