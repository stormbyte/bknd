export interface Serializable<Class, Json extends object = object> {
   toJSON(): Json;
   fromJSON(json: Json): Class;
}