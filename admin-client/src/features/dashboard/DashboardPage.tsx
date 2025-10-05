
import { PatternSearchDashboard } from "./PatternSearchDashboard";

export const DashboardPage = () => {
    return (
        <div className="h-full w-full overflow-y-auto bg-slate-950/40">
            <div className="py-6">
                <PatternSearchDashboard />
            </div>
        </div>
    );
};
