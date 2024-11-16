import {
   Input,
   SegmentedControl as MantineSegmentedControl,
   type SegmentedControlProps as MantineSegmentedControlProps
} from "@mantine/core";

type SegmentedControlProps = MantineSegmentedControlProps & {
   label?: string;
   description?: string;
};

export function SegmentedControl({ label, description, size, ...props }: SegmentedControlProps) {
   return (
      <Input.Wrapper className="relative">
         {label && (
            <div className="flex flex-col">
               <Input.Label size={size}>{label}</Input.Label>
               {description && <Input.Description size={size}>{description}</Input.Description>}
            </div>
         )}
         <MantineSegmentedControl {...props} size={size} />
      </Input.Wrapper>
   );
}
