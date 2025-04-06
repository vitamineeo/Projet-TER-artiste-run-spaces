
import React from 'react';
import { Network } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import RelationsGraph from './RelationsGraph';

const RelationsGraphSection = () => {
  return (
    <Card className="overflow-hidden border-none shadow-md">
      <CardContent className="p-6">
        <h2 className="flex items-center text-2xl font-bold mb-6 text-indigo-700">
          <Network className="mr-2 h-6 w-6" />
          Graphe des Relations Sémantiques
        </h2>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <RelationsGraph />
        </div>
      </CardContent>
    </Card>
  );
};

export default RelationsGraphSection;
