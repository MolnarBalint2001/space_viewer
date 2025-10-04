
import { Button } from 'primereact/button';
import { useMapSidebar } from './MapSidebarContext';


export const MapSidebar = () => {

    const { isOpened } = useMapSidebar();


    return (
        <div
            className={`${
                isOpened ? "w-[400px]" : "w-0" 
            } bg-slate-800 shadow-lg transition-all duration-300 ease-in-out flex flex-col border-r border-slate-900 overflow-hidden`}
            style={{ height: "calc(100vh - 58px)" }}
        >
            <div className="text-2xl font-medium p-4">Options</div>
        
        </div>
    );


}