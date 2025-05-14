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
        
        <div className="mb-4 bg-blue-50 p-4 rounded-lg">
          <p className="text-gray-700">
            Ce graphe illustre comment les espaces artistiques sont liés entre eux par leurs thématiques et contenus. 
            Chaque point représente un espace, et les liens indiquent des similarités sémantiques significatives.
          </p>
        </div>
        
        <RelationsGraph />
      </CardContent>
    </Card>
  );
};

export default RelationsGraphSection;