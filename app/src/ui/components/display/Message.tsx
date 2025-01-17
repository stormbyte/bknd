import { Empty, type EmptyProps } from "./Empty";

const NotFound = (props: Partial<EmptyProps>) => <Empty title="Not Found" {...props} />;
const NotAllowed = (props: Partial<EmptyProps>) => <Empty title="Not Allowed" {...props} />;

export const Message = {
   NotFound,
   NotAllowed
};
