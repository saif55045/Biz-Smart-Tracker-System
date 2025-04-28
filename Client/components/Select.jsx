export default function Select({value,onChange,options,name}){
    return (
        <>
        <select name={name} id="" onChange={onChange} value={value}>
        {options.map((option,index)=><option value={option} key={index}>{option}</option>)}
        </select>
        </>
    )
}