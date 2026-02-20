// import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "@radix-ui/react-select"
// import { Select } from "react-day-picker"

// interface PeriodProps {
//     selectedMonth: string,
//     onMonthChange: (month: string) => void
// }

// export function PeriodSelector({selectedMonth, onMonthChange}: PeriodProps){
//     return (
//     <Select value={selectedMonth} onValueChange={onMonthChange}>
//         <SelectTrigger className="w-[180px]">
//             <SelectValue />
//         </SelectTrigger>
//         <SelectContent>
//             {months.map((m) => (
//             <SelectItem key={m.value} value={m.value}>
//                 {m.label}
//             </SelectItem>
//             ))}
//         </SelectContent>
//     </Select>
//     )
// }