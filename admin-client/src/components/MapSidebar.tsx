import { useState } from 'react';
import { TabPanel, TabView } from 'primereact/tabview';
import { useMapSidebar } from './MapSidebarContext';
import { LabeledFeatures } from '../features/mapViewer/LabeledFeatures';
import { SimilarResearch } from '../features/mapViewer/SimilarResearch';

export const MapSidebar = () => {
    const { isOpened } = useMapSidebar();
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div
            className={`${
                isOpened ? "w-[400px]" : "w-0"
            } bg-slate-800 shadow-lg transition-all duration-300 ease-in-out flex flex-col border-r border-slate-900 overflow-hidden`}
            style={{ height: "calc(100vh - 58px)" }}
        >
            <div className="text-2xl font-medium p-4">Options</div>
            <TabView
                scrollable
                activeIndex={activeIndex}
                onTabChange={(e) => setActiveIndex(e.index)}
                className="flex-1 overflow-hidden"
            >
                <TabPanel header="Patterns detecting">
                    {/* TODO: Pattern detection configuration */}
                </TabPanel>
                <TabPanel header="Labeled features">
                    {/*<div className="h-[80vh]">
                        <LabeledFeatures isActive={activeIndex === 1} />
                    </div>*/}
                </TabPanel>
                <TabPanel header="Similar researches">
                    <div className="h-[80vh]">
                        <SimilarResearch/>
                    </div>
                </TabPanel>
            </TabView>
        </div>
    );
};



