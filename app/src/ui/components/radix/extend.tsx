import {
   type ComponentProps,
   type ComponentPropsWithRef,
   type ComponentPropsWithoutRef,
   type ElementRef,
   type ElementType,
   type ForwardedRef,
   type PropsWithChildren,
   type ReactElement,
   forwardRef
} from "react";

export function extend<ComponentType extends ElementType, AdditionalProps = {}>(
   Component: ComponentType,
   applyAdditionalProps?: (
      props: PropsWithChildren<ComponentPropsWithoutRef<ComponentType> & AdditionalProps> & {
         className?: string;
      }
   ) => ComponentProps<ComponentType>
) {
   return forwardRef<
      ElementRef<ComponentType>,
      ComponentPropsWithoutRef<ComponentType> & AdditionalProps
   >((props, ref) => {
      // Initialize newProps with a default empty object or the result of applyAdditionalProps
      let newProps: ComponentProps<ComponentType> & AdditionalProps = applyAdditionalProps
         ? applyAdditionalProps(props as any)
         : (props as any);

      // Append className if it exists in both props and newProps
      if (props.className && newProps.className) {
         newProps = {
            ...newProps,
            className: `${props.className} ${newProps.className}`
         };
      }

      // @ts-expect-error haven't figured out the correct typing
      return <Component {...newProps} ref={ref} />;
   });
}

type RenderFunction<ComponentType extends React.ElementType, AdditionalProps = {}> = (
   props: PropsWithChildren<ComponentPropsWithRef<ComponentType> & AdditionalProps> & {
      className?: string;
   },
   ref: ForwardedRef<ElementRef<ComponentType>>
) => ReactElement;

export function extendComponent<ComponentType extends React.ElementType, AdditionalProps = {}>(
   renderFunction: RenderFunction<ComponentType, AdditionalProps>
) {
   // The extended component using forwardRef to forward the ref to the custom component
   const ExtendedComponent = forwardRef<
      ElementRef<ComponentType>,
      ComponentPropsWithRef<ComponentType> & AdditionalProps
   >((props, ref) => {
      return renderFunction(props as any, ref);
   });

   return ExtendedComponent;
}

/*
export const Content = forwardRef<
   ElementRef<typeof DropdownMenu.Content>,
   ComponentPropsWithoutRef<typeof DropdownMenu.Content>
>(({ className, ...props }, forwardedRef) => (
   <DropdownMenu.Content
      className={`flex flex-col ${className}`}
      {...props}
      ref={forwardedRef}
   />
));

export const Item = forwardRef<
   ElementRef<typeof DropdownMenu.Item>,
   ComponentPropsWithoutRef<typeof DropdownMenu.Item>
>(({ className, ...props }, forwardedRef) => (
   <DropdownMenu.Item
      className={`flex flex-row flex-nowrap ${className}`}
      {...props}
      ref={forwardedRef}
   />
));
*/
