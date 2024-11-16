import { TbArrowDown, TbArrowUp, TbPlus, TbTrash } from "react-icons/tb";
import { Button } from "../../../buttons/Button";
import { IconButton } from "../../../buttons/IconButton";

export const AddButton = ({ onClick, disabled, ...rest }) => (
   <div className="flex flex-row">
      <Button onClick={onClick} disabled={disabled} IconLeft={TbPlus}>
         Add
      </Button>
   </div>
);

export const RemoveButton = ({ onClick, disabled, ...rest }) => (
   <div className="flex flex-row">
      <IconButton onClick={onClick} disabled={disabled} Icon={TbTrash} />
   </div>
);

export const MoveUpButton = ({ onClick, disabled, ...rest }) => (
   <div className="flex flex-row">
      <IconButton onClick={onClick} disabled={disabled} Icon={TbArrowUp} />
   </div>
);

export const MoveDownButton = ({ onClick, disabled, ...rest }) => (
   <div className="flex flex-row">
      <IconButton onClick={onClick} disabled={disabled} Icon={TbArrowDown} />
   </div>
);
