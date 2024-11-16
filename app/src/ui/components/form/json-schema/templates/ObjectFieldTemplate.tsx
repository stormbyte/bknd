import {
   type FormContextType,
   type ObjectFieldTemplatePropertyType,
   type ObjectFieldTemplateProps,
   type RJSFSchema,
   type StrictRJSFSchema,
   canExpand,
   descriptionId,
   getTemplate,
   getUiOptions,
   titleId
} from "@rjsf/utils";

/** The `ObjectFieldTemplate` is the template to use to render all the inner properties of an object along with the
 * title and description if available. If the object is expandable, then an `AddButton` is also rendered after all
 * the properties.
 *
 * @param props - The `ObjectFieldTemplateProps` for this component
 */
export default function ObjectFieldTemplate<
   T = any,
   S extends StrictRJSFSchema = RJSFSchema,
   F extends FormContextType = any
>(props: ObjectFieldTemplateProps<T, S, F>) {
   const {
      description,
      disabled,
      formData,
      idSchema,
      onAddClick,
      properties,
      readonly,
      registry,
      required,
      schema,
      title,
      uiSchema
   } = props;
   const options = getUiOptions<T, S, F>(uiSchema);
   const TitleFieldTemplate = getTemplate<"TitleFieldTemplate", T, S, F>(
      "TitleFieldTemplate",
      registry,
      options
   );
   const DescriptionFieldTemplate = getTemplate<"DescriptionFieldTemplate", T, S, F>(
      "DescriptionFieldTemplate",
      registry,
      options
   );

   /* if (properties.length === 0) {
      return null;
   } */
   const _canExpand = canExpand(schema, uiSchema, formData);
   if (properties.length === 0 && !_canExpand) {
      return null;
   }
   //console.log("multi:properties", uiSchema, props, options);

   // Button templates are not overridden in the uiSchema
   const {
      ButtonTemplates: { AddButton }
   } = registry.templates;

   return (
      <>
         <fieldset id={idSchema.$id} className="object-field">
            {title && (
               <TitleFieldTemplate
                  id={titleId<T>(idSchema)}
                  title={title}
                  required={required}
                  schema={schema}
                  uiSchema={uiSchema}
                  registry={registry}
               />
            )}
            {description && (
               <DescriptionFieldTemplate
                  id={descriptionId<T>(idSchema)}
                  description={description}
                  schema={schema}
                  uiSchema={uiSchema}
                  registry={registry}
               />
            )}

            {properties.map((prop: ObjectFieldTemplatePropertyType) => prop.content)}
            {_canExpand && (
               <AddButton
                  className="object-property-expand"
                  onClick={onAddClick(schema)}
                  disabled={disabled || readonly}
                  uiSchema={uiSchema}
                  registry={registry}
               />
            )}
         </fieldset>
      </>
   );
}
