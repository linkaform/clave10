import { getMenu } from "@/lib/login/get-menu";
import { capitalizeFirstLetter } from "@/lib/utils";
import { useMenuStore } from "@/store/useGetMenuStore";
import { useQuery } from "@tanstack/react-query";

export const useGetMenu = () => {
	const {
		menuItems,
		setLabels,
		labels,
		setMenuItems,
        setExcludes,
        setIncludes
	} = useMenuStore();
	
	const { isLoading:isLoadingMenu, error:errorMenu, refetch: refetfchMenu } = useQuery<any>({
	queryKey: ["getMenu"], 
	queryFn: async () => {
		const data = await getMenu();
		if (!data.response || !data.response?.data || !data.response?.data.menus) {
			return []
		}
		if(data.response?.data.menus){
			const dataRaw =data.response?.data.menus
            const excludeInputs =data.response?.data.exclude_inputs
            const includeInputs =data.response?.data.include_inputs
			setLabels(dataRaw);
            const transformedData = dataRaw.flatMap((item: string) => {
                let text = item;
              
                if (item === "incidencias") {
                  text = "Incidencias / Fallas";
                } else if (item === "articulos") {
                  text = "Artículos Perdidos / Concesionados";
                } else if (item === "pases") {
                  text = "Pases de entrada";
                } else {
                  text = capitalizeFirstLetter(item);
                }
              
                const baseItem = {
                  id: item,
                  label: text,
                };
              
                if (item === "pases") {
                  return [
                    baseItem,
                    {
                      id: "crear_pase",
                      label: "Crear pase",
                    },
                  ];
                }
              
                return [baseItem];
              });
            setExcludes(excludeInputs)
            setIncludes(includeInputs)
            setMenuItems(transformedData)
        }
		
		return data.response?.data.menus||null;
	},
	refetchOnWindowFocus: false, 
	refetchInterval: false,
	refetchOnReconnect: false, 
	staleTime: Infinity, 
	});

  return {
    // Menu
    menuItems,
	labels,
    isLoadingMenu,
    errorMenu,
	refetfchMenu
  };
}