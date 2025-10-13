import React from "react";
import { Search } from "lucide-react";
import { Input as AntInput } from "antd";
import { Card, CardContent } from "../ui/card";

const SearchBar = ({ 
    placeholder = "Tìm kiếm...", 
    value,
    onChange,
    className = "",
    style = {}
}) => {
    return (
        <Card className={className} style={style}>
            <CardContent className="pt-6">
                <AntInput
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className="h-12 text-base"
                    prefix={<Search className="h-5 w-5 text-slate-400" />}
                    style={{
                        borderColor: 'rgba(26, 52, 59, 0.2)',
                        backgroundColor: 'rgba(189, 193, 194, 0.2)'
                    }}
                />
            </CardContent>
        </Card>
    );
};

export default SearchBar;
