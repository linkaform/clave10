import { getShift } from "@/lib/get-shift";
import { errorMsj } from "@/lib/utils";
import { toast } from "sonner";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ShiftStore {
  area: string;
  location: string;
  checkin_id: string | undefined;
  isLoading: boolean;
  turno: boolean;
  tab:string;
  filter:string;
  isFetching:boolean;
  option:string[]
  from:string;
  downloadPass:string[];

  setIsFetching: (isFetching: boolean) => void;
  setTab: (tab: string) => void;
  setFilter:(filter:string)=>void;
  setOption:(option:string[])=>void;
  setArea: (area: string) => void;
  setLocation: (location: string) => void;
  setCheckin_id: (id: string | undefined) => void;
  setLoading: (loading: boolean) => void;
  setTurno:(turno:boolean)=>void;
  clearShift: () => void;
  fetchShift: () => Promise<any>;
  setFrom: (from:string)=>void;
  setDownloadPass: (from:string[])=>void;
}

export const useShiftStore = create(
  persist<ShiftStore>(
		(set, get) => ({
		area: "",
		location: "",
		checkin_id: undefined,
		isLoading: false,
		turno:false,
		tab:"",
		filter:"",
		option:[],
		isFetching:false,
		from:"",
		downloadPass:[],
		setIsFetching:(isFetching) => set({isFetching}),
		setDownloadPass:(downloadPass) => set({downloadPass}),
		setTab:(tab) => set({tab}),
		setFilter:(filter) => set({filter}),
		setOption:(option) => set({option}),
		setArea: (area) => set({ area }),
		setLocation: (location) => set({ location }),
		setCheckin_id: (id) => set({ checkin_id: id }),
		setLoading: (loading) => set({ isLoading: loading }),
		setTurno:(turno) => set({ turno }),
		clearShift: () => set({
			area: "",
			location: "",
			checkin_id: undefined,
			isLoading: false,
			turno:false,
			tab:"",
			downloadPass:[],
		}),
		setFrom:(from:string) => set({ from }),
		fetchShift: async () => {
			const { area, location, setArea, setLocation, setTurno, isFetching,setIsFetching ,setDownloadPass} = get();
			if (isFetching || (area && location)) return;
			setIsFetching(true);
		  
			try {
				const data = await getShift({ area, location });
				const hasError = (!data?.success) || (data?.response?.data?.status_code === 400 )
				if (hasError) {
					const textMsj = errorMsj(data)
					throw new Error(`Error al obtener load shift, Error: ${textMsj?.text}`);
				} else {
						setArea(data.response?.data?.location?.area ?? "");
						setLocation(data.response?.data?.location?.name ?? "");
						setTurno(data?.response.data?.guard?.status_turn === "Turno Abierto");
						setDownloadPass(data?.response?.data?.booth_config ?? [])
						return data.response?.data
				}
			} catch (error) {
			  toast.error("Error al obtener información: " + error);
			} finally {
			  setIsFetching(false);
			}
		  },
	  }),
    {
      name: "shift-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);




