import {
   Children,
   type Dispatch,
   type SetStateAction,
   createContext,
   useContext,
   useState
} from "react";

export type TStepsProps = {
   children: any;
   initialPath?: string[];
   initialState?: any;
   lastBack?: () => void;
   [key: string]: any;
};

type TStepContext<T = any> = {
   nextStep: (step: string) => () => void;
   stepBack: () => void;
   close: () => void;
   state: T;
   path: string[];
   setState: Dispatch<SetStateAction<T>>;
};

const StepContext = createContext<TStepContext>(undefined as any);

export function Steps({ children, initialPath = [], initialState = {}, lastBack }: TStepsProps) {
   const [state, setState] = useState<any>(initialState);
   const [path, setPath] = useState<string[]>(initialPath);
   const steps: any[] = Children.toArray(children).filter(
      (child: any) => child.props.disabled !== true
   );

   function stepBack() {
      if (path.length === 0) {
         lastBack?.();
      } else {
         setPath((prev) => prev.slice(0, -1));
      }
   }

   const nextStep = (step: string) => () => {
      setPath((prev) => [...prev, step]);
   };

   const current = steps.find((step) => step.props.id === path[path.length - 1]) || steps[0];

   return (
      <StepContext.Provider value={{ nextStep, stepBack, state, path, setState, close: lastBack! }}>
         {current}
      </StepContext.Provider>
   );
}

export function useStepContext<T = any>(): TStepContext<T> {
   return useContext(StepContext);
}

export function Step({
   children,
   disabled = false,
   path = [],
   id,
   ...rest
}: { children: React.ReactNode; disabled?: boolean; id: string; path?: string[] }) {
   return <div {...rest}>{children}</div>;
}
